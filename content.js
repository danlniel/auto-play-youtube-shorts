// Auto Play for YouTube Shorts - content script
// Watches the active YouTube Short's <video> element and advances to the
// next Short once playback completes (detected via loop-wraparound or the
// native "ended" event).
(function () {
  "use strict";

  const LOOP_JUMP_THRESHOLD = 2; // seconds - currentTime must drop by more than this to count as a loop
  const NEAR_END_WINDOW = 1.5; // seconds - lastTime must be within this of duration to count as "finished"
  const ADVANCE_COOLDOWN = 1500; // ms - ignore repeat advance calls within this window
  const WATCH_INTERVAL = 1000; // ms - poll rate for detecting a changed active video

  let enabled = true;
  let hookedVideo = null;
  let lastTime = 0;
  let lastAdvanceAt = 0;
  let watchIntervalId = null;

  // --- storage: read initial state + live updates -----------------------
  chrome.storage.sync.get({ enabled: true }, (items) => {
    enabled = items.enabled !== false;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && Object.prototype.hasOwnProperty.call(changes, "enabled")) {
      enabled = changes.enabled.newValue !== false;
    }
  });

  function isShortsPage() {
    return location.pathname.indexOf("/shorts/") === 0;
  }

  // --- finding the active video ------------------------------------------
  function findActiveVideo() {
    const active = document.querySelector("ytd-reel-video-renderer[is-active] video");
    if (active) return active;

    // Fallback: any video on the page that appears to actually be playing.
    const videos = document.querySelectorAll("video");
    for (const v of videos) {
      if (!v.paused && v.readyState > 0 && v.duration > 0) {
        return v;
      }
    }
    return null;
  }

  // --- advancing to the next short ----------------------------------------
  function advanceToNextShort() {
    const now = Date.now();
    if (now - lastAdvanceAt < ADVANCE_COOLDOWN) return;
    lastAdvanceAt = now;

    const nextButton = document.querySelector("#navigation-button-down button");
    if (nextButton) {
      nextButton.click();
      return;
    }

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowDown",
        code: "ArrowDown",
        keyCode: 40,
        which: 40,
        bubbles: true,
      })
    );
  }

  // --- video event handlers ------------------------------------------------
  function handleTimeUpdate(event) {
    if (!enabled || !isShortsPage()) return;
    const video = event.target;
    const currentTime = video.currentTime;
    const duration = video.duration;

    // A user scrubbing the seek bar backwards must not count as a loop.
    if (video.seeking) {
      lastTime = currentTime;
      return;
    }

    if (
      duration > 0 &&
      currentTime < lastTime - LOOP_JUMP_THRESHOLD &&
      duration - lastTime <= NEAR_END_WINDOW
    ) {
      advanceToNextShort();
    }

    lastTime = currentTime;
  }

  function handleEnded() {
    if (!enabled || !isShortsPage()) return;
    advanceToNextShort();
  }

  // --- hook management -------------------------------------------------------
  function unhook() {
    if (hookedVideo) {
      hookedVideo.removeEventListener("timeupdate", handleTimeUpdate);
      hookedVideo.removeEventListener("ended", handleEnded);
      hookedVideo = null;
    }
  }

  function hook(video) {
    if (video === hookedVideo) return;
    unhook();
    hookedVideo = video;
    lastTime = video.currentTime || 0;
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
  }

  function refreshHook() {
    if (!isShortsPage()) {
      unhook();
      return;
    }
    const video = findActiveVideo();
    if (video && video !== hookedVideo) {
      hook(video);
    } else if (!video) {
      unhook();
    }
  }

  // --- re-hook on SPA navigation + periodic poll -----------------------------
  window.addEventListener("yt-navigate-finish", refreshHook);

  watchIntervalId = setInterval(refreshHook, WATCH_INTERVAL);

  // initial attempt
  refreshHook();
})();

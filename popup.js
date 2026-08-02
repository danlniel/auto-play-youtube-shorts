// Auto Play YouTube Shorts - popup script
// Syncs the toggle switch with the `enabled` flag in chrome.storage.sync.
(function () {
  "use strict";

  const toggle = document.getElementById("enabled-toggle");

  chrome.storage.sync.get({ enabled: true }, (items) => {
    toggle.checked = items.enabled !== false;
  });

  toggle.addEventListener("change", () => {
    chrome.storage.sync.set({ enabled: toggle.checked });
  });
})();

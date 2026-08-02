# Auto Play for YouTube Shorts

A tiny Chrome extension that automatically advances to the next YouTube Short
once the current one finishes playing.

## Features

- Automatically jumps to the next Short when the current one finishes.
- Simple on/off toggle in the extension popup (defaults to on).
- No tracking, no network requests, no permissions beyond local settings
  storage.
- Pure vanilla JavaScript, Manifest V3, zero build step.

## Install (unpacked, for development)

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select this project's folder.
5. Open any `youtube.com/shorts/...` URL and the extension will start
   working. Use the toolbar popup to toggle auto-advance on or off.

Alternatively, download a packaged `.zip` from the project's **Releases**
page (if available) and load the unpacked folder after extracting it.

## How it works

YouTube Shorts videos are looping `<video>` elements (`loop = true`), so the
native `ended` event almost never fires — the video just jumps back to
`currentTime = 0` and keeps playing. To detect a completed viewing, the
content script watches `timeupdate` events on the active Short's video and
looks for a **loop wraparound**: if `currentTime` suddenly drops by more than
~2 seconds while the previous timestamp was close to the video's `duration`,
that's treated as "the video finished once" and the extension advances to
the next Short. The native `ended` event is also handled as a fallback for
non-looping videos.

Advancing is done by clicking YouTube's own "next" button
(`#navigation-button-down button`) when present, or by dispatching an
`ArrowDown` keydown event otherwise (the same shortcut YouTube itself uses
to move to the next Short). A short cooldown prevents duplicate advances
from firing in quick succession.

The script re-attaches its listeners whenever the active video changes,
using YouTube's `yt-navigate-finish` event plus a lightweight polling
interval as a safety net for single-page-app navigation.

## Disclaimer

This project is an independent, unofficial browser extension and is **not
affiliated with, endorsed by, or sponsored by YouTube or Google**. "YouTube"
and "YouTube Shorts" are trademarks of Google LLC.

## License

MIT — see [LICENSE](LICENSE).

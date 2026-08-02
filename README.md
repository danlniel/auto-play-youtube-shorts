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

## Development

There is no compile step — the extension is plain JavaScript. A `Makefile`
wraps the common tasks:

```sh
make check       # validate manifest.json and JS syntax
make package     # build dist/auto-play-youtube-shorts-v<version>.zip
make icons       # regenerate icons/ from scripts/gen_icons.py
make screenshot  # render the 1280x800 store screenshot (needs Chrome, macOS path)
make release     # tag v<version> and publish a GitHub release with the zip
make clean       # remove dist/
```

The version is read from `manifest.json`, so bumping it there is enough for
`make package` and `make release` to pick it up.

## Disclaimer

This project is an independent, unofficial browser extension and is **not
affiliated with, endorsed by, or sponsored by YouTube or Google**. "YouTube"
and "YouTube Shorts" are trademarks of Google LLC.

## License

MIT — see [LICENSE](LICENSE).

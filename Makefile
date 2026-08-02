# Auto Play for YouTube Shorts — build tasks
#
# There is no compile step (vanilla JS, Manifest V3); "building" means
# validating the sources and packaging them into a zip that Chrome and the
# Chrome Web Store accept.

NAME    := auto-play-youtube-shorts
VERSION := $(shell python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
ZIP     := dist/$(NAME)-v$(VERSION).zip
SRC     := manifest.json content.js popup.html popup.js \
           icons/icon16.png icons/icon48.png icons/icon128.png
CHROME  := /Applications/Google Chrome.app/Contents/MacOS/Google Chrome

.DEFAULT_GOAL := help

.PHONY: help check package icons screenshot release clean

help: ## Show this help
	@grep -E '^[a-z]+:.*##' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-12s %s\n", $$1, $$2}'

check: ## Validate manifest JSON and JS syntax
	python3 -c "import json; json.load(open('manifest.json'))"
	node --check content.js
	node --check popup.js
	@echo "check OK"

package: check $(SRC) ## Build the distributable zip into dist/
	mkdir -p dist
	rm -f "$(ZIP)"
	zip -r "$(ZIP)" manifest.json content.js popup.html popup.js icons -x "*.DS_Store"
	@echo "built $(ZIP)"

icons: ## Regenerate icons/icon{16,48,128}.png
	python3 scripts/gen_icons.py

screenshot: ## Render the 1280x800 Chrome Web Store screenshot (needs Chrome)
	mkdir -p dist/store-assets
	"$(CHROME)" --headless --disable-gpu --hide-scrollbars \
		--window-size=1280,800 \
		--screenshot=dist/store-assets/screenshot-1280x800.png \
		"file://$(CURDIR)/scripts/promo.html"

release: package ## Tag v$(VERSION) and publish a GitHub release with the zip
	git tag v$(VERSION)
	git push origin v$(VERSION)
	gh release create v$(VERSION) "$(ZIP)" --title "v$(VERSION)" --generate-notes

clean: ## Remove build artifacts
	rm -rf dist

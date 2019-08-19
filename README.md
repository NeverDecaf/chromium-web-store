# chromium-web-store
This extension brings the following functionality to ungoogled-chromium (and other forks that lack web store support):
- Allows installing extensions directly from chrome web store.
- Automatically checks for updates to your installed extensions and displays them on the badge.
#### Usage
- If you wish to install extensions directly instead of just downloading the crx, you must change the flag `chrome://flags/#extension-mime-request-handling` to `Always prompt for install`.
- Available extension updates will display on the badge, click to install them (note that non-webstore extensions may need to be installed manually even if you have the flag set.)
- Automatic update checks only happen on browser startup. Clicking the badge does a check immediately.

#### Installation
- Download the .crx from [Releases](https://github.com/NeverDecaf/chromium-web-store/releases/latest) and drag-and-drop it into `chrome://extensions`

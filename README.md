# chromium-web-store
This extension brings the following functionality to ungoogled-chromium (and other forks that lack web store support):
- Allows installing extensions directly from chrome web store.
- Automatically checks for updates to your installed extensions and displays them on the badge.
![Example Image](https://raw.githubusercontent.com/NeverDecaf/chromium-web-store/master/sample.png)
#### Usage
- If you wish to install extensions directly instead of just downloading the crx, you must change the flag `chrome://flags/#extension-mime-request-handling` to `Always prompt for install`.
- Available extension updates will display on the badge, click to install them (note that non-webstore extensions may need to be installed manually even if you have the flag set.)

#### Installation
- Download the .crx from [Releases](https://github.com/NeverDecaf/chromium-web-store/releases/latest) and drag-and-drop it into `chrome://extensions`

#### Options Notes
- Right click the badge and choose `Options` from the context menu or access them via `chrome://extensions`.
- Automatic updates normally occur on browser startup, extension addition/removal, and once per hour.
- "Web Store" extensions refer to any that were obtained from the [Chrome Web Store](https://chrome.google.com/webstore/category/extensions), despite displaying `Source: Not from Chrome Web Store` when checking extension details.

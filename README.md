# chromium-web-store
This extension brings the following functionality to ungoogled-chromium (and other forks that lack web store support):
- Allows installing extensions directly from chrome web store.
- Automatically checks for updates to your installed extensions and displays them on the badge.
![Example Image](https://raw.githubusercontent.com/NeverDecaf/chromium-web-store/master/sample2.PNG)
#### Usage
- If you wish to install extensions directly instead of just downloading the crx, you must change the flag `chrome://flags/#extension-mime-request-handling` to `Always prompt for install`.
- Available extension updates will display on the badge, click to install them (note that non-webstore extensions may need to be installed manually even if you have the flag set.)
#### Installation
1. Go to `chrome://extensions` and enable developer mode (toggle in top right).
2. Download the .crx from [Releases](https://github.com/NeverDecaf/chromium-web-store/releases/latest) and drag-and-drop it onto the `chrome://extensions` page.
#### If drag-and-dropping does not work, try this workaround:
1. Download the .crx from releases and extract the contents to a folder.
2. Visit `chrome://extensions/` and turn on developer mode (toggle in top right).
3. Click `Load unpacked` and select the directory you extracted the crx to.
#### Setup Video
[![here](https://raw.githubusercontent.com/NeverDecaf/chromium-web-store/master/video_thumbnail.png)](https://chromium.woolyss.com/f/video-extension-chromium-web-store.mp4)
[[Streamable Mirror](https://streamable.com/655nn)] (Thanks [@woolyss](https://github.com/woolyss) for creating & hosting this video.)
#### Options Notes
- Right click the badge and choose `Options` from the context menu or access them via `chrome://extensions`.
- Automatic updates normally occur on browser startup, extension addition/removal, and once per hour.
- "Web Store" extensions refer to any that were obtained from the [Chrome Web Store](https://chrome.google.com/webstore/category/extensions), despite displaying `Source: Not from Chrome Web Store` when checking extension details.

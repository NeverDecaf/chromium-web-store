# chromium-web-store

This extension brings the following functionality to ungoogled-chromium (and other forks that lack web store support):

-   Allows installing extensions directly from chrome web store.
-   Automatically checks for updates to your installed extensions and displays them on the badge.
    ![Example Image](https://raw.githubusercontent.com/NeverDecaf/chromium-web-store/master/sample2.PNG)

# Read this first

-   **If you are using `ungoogled-chromium`**: You **must** change the flag `chrome://flags/#extension-mime-request-handling` to `Always prompt for install`.
-   **If you are NOT using `ungoogled-chromium`**: Ensure the following option is **checked**: Extension Options (chrome://extensions/?options=ocaahdebbfolfmndjeplogmgcagdmblk) > Advanced > `Always download CRX files`
-   If you are seeing `CRX_REQUIRED_PROOF_MISSING` or `Apps, extensions and user scripts cannot be added from this website` errors, please be **sure** you have followed the instructions above before opening an issue.
-   Some extensions may not update until you restart your browser, see [#4](https://github.com/NeverDecaf/chromium-web-store/issues/4).
-   If you do not see the `Add to Chromium` button in the web store, you can use the context menu option instead: Right click > `Add to Chromium`.

#### Usage

-   Pin the Chromium Web Store badge in your browser's toolbar. (Badges are hidden by default)
-   The badge will show a red number indicating available updates.
-   Click on the badge, then click the name of any extension to install the latest version.
-   This method will work for non-webstore extensions as well if they support it, including chromium web store itself. (See the section at the bottom of this readme if you are an extension developer and don't have your extension listed in the chrome web store.)

#### Installation
1. Go to `chrome://flags` and search for the `#extension-mime-request-handling` flag and set it to `Always prompt for install`.
2. Download the .crx from [Releases](https://github.com/NeverDecaf/chromium-web-store/releases/latest), you should be prompted to install the extension.

If the above steps do not work for you, try one of the following alternative methods:

#### Installation (Alternative #1)
1. Go to `chrome://extensions` and enable developer mode (toggle in top right).
2. Download the .crx from [Releases](https://github.com/NeverDecaf/chromium-web-store/releases/latest) and drag-and-drop it onto the `chrome://extensions` page.

#### Installation (Alternative #2)
1. Download the .crx from [Releases](https://github.com/NeverDecaf/chromium-web-store/releases/latest) and extract the contents to a folder.
2. Visit `chrome://extensions/` and turn on developer mode (toggle in top right).
3. Click `Load unpacked` and select the directory you extracted the crx to.

#### Setup Video

[![here](https://raw.githubusercontent.com/NeverDecaf/chromium-web-store/master/video_thumbnail.png)](https://chromium.woolyss.com/f/video-extension-chromium-web-store.mp4)
[[Streamable Mirror](https://streamable.com/655nn)] (Thanks [@woolyss](https://github.com/woolyss) for creating & hosting this video.)

#### Options Notes

-   Right click the badge and choose `Options` from the context menu or access them via `chrome://extensions`.
-   "Web Store" extensions refer to any that were obtained from the [Chrome Web Store](https://chrome.google.com/webstore/category/extensions), despite displaying `Source: Not from Chrome Web Store` when checking extension details.
-   Please read the note in [Release 1.4](https://github.com/NeverDecaf/chromium-web-store/releases/tag/v1.4.0) if you wish to use the import/export feature.

#### If you wish to help with localization, follow these steps:

1. Create a directory in `_locales` named any supported [locale code](https://developer.chrome.com/webstore/i18n?csw=1#localeTable).
2. Copy `_locales/en/messages.json` to your newly created directory and edit the "message" fields as necessary, you don't need to change anything else.
3. Submit a PR or open an issue with your translation and I will merge it.

#### If you are a chrome extension developer...

and do not have your extension listed in the Chrome Web Store, you can still enable updates via chromium-web-store by hosting an [update manifest file](https://developer.chrome.com/apps/autoupdate#update_manifest); see [updates.xml](https://github.com/NeverDecaf/chromium-web-store/blob/master/updates.xml) in this repo for an example. You must also specify a url to access this file in your extension's `manifest.json` under the [`update_url`](https://developer.chrome.com/apps/autoupdate#update_url) field; again, see [manifest.json](https://github.com/NeverDecaf/chromium-web-store/blob/master/src/manifest.json) in this repo for an example.

#### For deployment

See [#28](https://github.com/NeverDecaf/chromium-web-store/issues/28) and [`managed_storage.json`](https://github.com/NeverDecaf/chromium-web-store/blob/master/src/managed_storage.json)

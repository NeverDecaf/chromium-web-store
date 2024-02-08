importScripts("./util.js");
const nonWebstoreExtensionsDownloading = new Set();
const manualInstallExtensionsDownloading = new Set();
const tabsAwaitingInstall = new Set();
const extensionsTabId = {};
function handleContextClick(info, tab) {
    if (info.menuItemId == "updateAll")
        checkForUpdates(function (
            updateCheck,
            installed_versions,
            appid,
            updatever,
            is_webstore
        ) {
            let crx_url = updateCheck["@codebase"];
            promptInstall(crx_url, is_webstore, WEBSTORE.chrome, msgHandler);
        });
    else if (info.menuItemId == "installExt") {
        let store = WEBSTORE.chrome;
        [...WEBSTORE_MAP.keys()].some((k) => {
            if (k.test(tab.url)) {
                store = WEBSTORE_MAP.get(k);
                return true;
            }
        });
        promptInstall(buildExtensionUrl(tab.url), true, store, msgHandler);
    } else if (info.menuItemId == "cws")
        chrome.tabs.create({
            url: "https://chrome.google.com/webstore/",
        });
}

function updateBadge(modified_ext_id = null) {
    checkForUpdates();
}

function startupTasks() {
    chrome.storage.sync.get(DEFAULT_MANAGEMENT_OPTIONS, function (settings) {
        chrome.storage.local.get(
            {
                badge_display: "",
                last_scheduled_update: 0,
            },
            (localstore) => {
                chrome.action.setBadgeText({
                    text: localstore.badge_display,
                });
                chrome.alarms.create("cws_check_extension_updates", {
                    delayInMinutes: Math.max(
                        1,
                        settings.update_period_in_minutes -
                            Math.floor(
                                (Date.now() -
                                    localstore.last_scheduled_update) /
                                    1000 /
                                    60
                            )
                    ),
                    periodInMinutes: settings.update_period_in_minutes,
                });
            }
        );
    });
}
chrome.action.setBadgeBackgroundColor({
    color: "#FE0000",
});
chrome.management.onInstalled.addListener(function (ext) {
    updateBadge(ext.id);
    for (let tabid of tabsAwaitingInstall) {
        chrome.tabs.sendMessage(
            tabid,
            {
                action: "extInstalled",
                extId: ext.id,
            },
            () => {
                if (chrome.runtime.lastError) tabsAwaitingInstall.delete(tabid);
            }
        );
    }
});
chrome.management.onUninstalled.addListener(function (ext) {
    updateBadge(ext.id);
});
chrome.runtime.onStartup.addListener(function () {
    startupTasks();
});
chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name == "cws_check_extension_updates")
        chrome.storage.sync.get(
            DEFAULT_MANAGEMENT_OPTIONS,
            function (settings) {
                if (settings.auto_update) {
                    updateBadge();
                    chrome.storage.local.set({
                        last_scheduled_update: Date.now(),
                    });
                    chrome.alarms.create("cws_check_extension_updates", {
                        delayInMinutes: settings.update_period_in_minutes,
                        periodInMinutes: settings.update_period_in_minutes,
                    });
                }
            }
        );
});
chrome.runtime.onInstalled.addListener(function () {
    startupTasks();
    chrome.contextMenus.create({
        title: "Update all extensions",
        id: "updateAll",
        contexts: ["action"],
    });
    chrome.contextMenus.create({
        title: "🔗 Chrome Web Store",
        id: "cws",
        contexts: ["action"],
    });
    chrome.contextMenus.create({
        title: "Add to Chromium",
        id: "installExt",
        documentUrlPatterns: [
            "https://chrome.google.com/webstore/detail/*",
            "https://addons.opera.com/*/extensions/details/*",
            "https://microsoftedge.microsoft.com/addons/detail/*",
        ],
    });
});
const msgHandler = function (request, sender, sendResponse) {
    if (request.nonWebstoreDownloadUrl) {
        chrome.downloads.download(
            {
                url: request.nonWebstoreDownloadUrl,
            },
            (dlid) => {
                nonWebstoreExtensionsDownloading.add(dlid);
            }
        );
    }
    if (request.manualInstallDownloadUrl) {
        chrome.downloads.download(
            {
                url: request.manualInstallDownloadUrl,
                saveAs: true, // required to suppress warning: "Apps, extensions and user scripts cannot be added from this website"
            },
            (dlid) => {
                manualInstallExtensionsDownloading.add(dlid);
            }
        );
    }
    if (request.newTabUrl) {
        chrome.tabs.create({ active: false }, (tab) => {
            chrome.tabs.update(tab.id, { url: request.newTabUrl });
        });
    }
    if (request.checkExtInstalledId) {
        chrome.management.get(request.checkExtInstalledId, (extinfo) => {
            sendResponse({
                installed: !(chrome.runtime.lastError && !extinfo),
            });
        });
        return true;
    }
    if (request.uninstallExt) {
        chrome.management.uninstall(request.uninstallExt, () => {
            sendResponse({ uninstalled: !chrome.runtime.lastError });
        });
        return true;
    }
    if (request.installExt) {
        tabsAwaitingInstall.add(sender.tab.id);
    }
};
chrome.runtime.onMessage.addListener(msgHandler);
chrome.downloads.onChanged.addListener((d) => {
    // open chrome://extensions if user has "Always download CRX files" checked, for easy drag-and-drop installation
    if (d.endTime && manualInstallExtensionsDownloading.has(d.id)) {
        manualInstallExtensionsDownloading.delete(d.id);
        chrome.tabs.get(extensionsTabId?.id ?? 0, (tab) => {
            if (!chrome.runtime.lastError)
                chrome.tabs.highlight({
                    tabs: tab.index,
                    windowId: tab.windowId,
                });
            else
                chrome.tabs.create(
                    {
                        url: "chrome://extensions/",
                    },
                    (tab) => {
                        extensionsTabId.id = tab.id;
                    }
                );
        });
        // chrome.notifications.create("manually_install", {
        //     type: "basic",
        //     iconUrl: "assets/icon/icon_128.png",
        //     title: "Extension downloaded! Please install manually:",
        //     message: "1. Enable Developer mode (top right)
2. Drag .crx from downloads bar onto extensions page",
        // });
    }
});
chrome.contextMenus.onClicked.addListener(handleContextClick);

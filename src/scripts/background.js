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
            is_webstore,
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
                                    60,
                            ),
                    ),
                    periodInMinutes: settings.update_period_in_minutes,
                });
            },
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
            },
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
            },
        );
});
chrome.runtime.onInstalled.addListener(function () {
    startupTasks();
    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("contextMenu_updateAll"),
        id: "updateAll",
        contexts: ["action"],
    });
    chrome.contextMenus.create({
        title: "🔗 Chrome Web Store",
        id: "cws",
        contexts: ["action"],
    });
    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("webstore_addButton"),
        id: "installExt",
        documentUrlPatterns: [
            "https://chrome.google.com/webstore/detail/*",
            "https://chromewebstore.google.com/detail/*",
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
            },
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
            },
        );
    }
    if (request.newTabUrl) {
        chrome.tabs.create({ active: false, url: request.newTabUrl });
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
                    },
                );
        });
        // chrome.notifications.create("manually_install", {
        //     type: "basic",
        //     iconUrl: "assets/icon/icon_128.png",
        //     title: chrome.i18n.getMessage("notify_manuallyInstall_title"),
        //     message: chrome.i18n.getMessage("notify_manuallyInstall_message"),
        // });
    }
});
chrome.contextMenus.onClicked.addListener(handleContextClick);

// below functions are for the new chrome web store:
// port is used for functions with callbacks:
chrome.runtime.onConnectExternal.addListener((port) => {
    var port_disconnected = false;
    port.onDisconnect.addListener(() => {
        port_disconnected = true;
    });
    port.onMessage.addListener(function (msg, port) {
        // console.log("recieved msg through port:", msg);
        switch (msg.func) {
            case "onInstalled":
                var [callback, ..._] = msg.args;
                chrome.management.onInstalled.addListener(function cb() {
                    if (port_disconnected) {
                        chrome.management.onInstalled.removeListener(cb);
                        return;
                    }
                    port.postMessage({
                        args: arguments,
                        callbackIndex: callback,
                        err: chrome.runtime.lastError,
                    });
                });
                break;
            case "onUninstalled":
                var [callback, ..._] = msg.args;
                chrome.management.onUninstalled.addListener(function cb() {
                    if (port_disconnected) {
                        chrome.management.onUninstalled.removeListener(cb);
                        return;
                    }
                    port.postMessage({
                        args: arguments,
                        callbackIndex: callback,
                        err: chrome.runtime.lastError,
                    });
                });
                break;
            case "uninstall":
                var [ext_id, options, callback, ..._] = msg.args;
                chrome.management.uninstall(ext_id, options, function () {
                    port.postMessage({
                        args: arguments,
                        callbackIndex: callback,
                        err: chrome.runtime.lastError,
                    });
                });
                break;
            case "setEnabled":
                var [ext_id, enabled, callback, ..._] = msg.args;
                chrome.management.setEnabled(ext_id, enabled, function () {
                    port.postMessage({
                        args: arguments,
                        callbackIndex: callback,
                        err: chrome.runtime.lastError,
                    });
                });
                break;
        }
    });
});
chrome.runtime.onMessageExternal.addListener(function (
    request,
    sender,
    sendResponse,
) {
    // console.log("recieved msg through runtime:", request);
    switch (request.func) {
        case "getExtensionStatus":
            var [id, ext, ..._] = request.args;
            chrome.management.getAll((exts) => {
                const this_ext = exts.filter((extInfo) => extInfo.id === id);
                if (!this_ext.length) {
                    sendResponse({ args: ["installable"] });
                    return;
                }
                sendResponse({
                    args: [this_ext[0].enabled ? "enabled" : "disabled"],
                });
            });
            break;
        case "getAll":
            var [id, ..._] = request.args;
            chrome.management.getAll((exts) => {
                // instead of exposing entire extension list, filter to only the relevant extension.
                sendResponse({
                    args: [exts.filter((extInfo) => extInfo.id === id)],
                });
            });
            break;
        case "beginInstallWithManifest3":
            var [extInfo, href, ..._] = request.args;

            promptInstall(
                buildExtensionUrl(href),
                true,
                WEBSTORE.chrome,
                msgHandler,
            );
            sendResponse({
                // because a "cancel" in the context of chromium-web-store won't be detected,
                // we must throw user_cancelled here to ensure the button doesn't get stuck on loading spinner.
                // The behaviour of this is similar to sending success ("") so this should be fine.
                args: ["user_cancelled"],
            });
            break;
    }
});

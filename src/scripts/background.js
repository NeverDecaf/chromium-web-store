var extensionsDownloads = {};
var default_options = {
    auto_update: true,
    check_store_apps: true,
    check_external_apps: true,
    update_period_in_minutes: 60,
};
const tabsAwaitingInstall = new Set();

function handleContextClick(info, tab) {
    if (info.menuItemId == "updateAll")
        checkForUpdates(function (
            updateCheck,
            installed_versions,
            appid,
            updatever,
            is_webstore
        ) {
            let crx_url = updateCheck.getAttribute("codebase");
            promptInstall(crx_url, is_webstore, extensionsDownloads);
        });
    else if (info.menuItemId == "installExt")
        chrome.tabs.sendMessage(tab.id, {
            action: "install",
        });
    else if (info.menuItemId == "cws")
        chrome.tabs.create({
            url: "https://chrome.google.com/webstore/",
        });
}

function updateBadge(modified_ext_id = null) {
    checkForUpdates();
}

function startupTasks() {
    chrome.storage.sync.get(default_options, function (settings) {
        chrome.storage.local.get(
            {
                badge_display: "",
                last_scheduled_update: 0,
            },
            (localstore) => {
                chrome.browserAction.setBadgeText({
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
chrome.browserAction.setBadgeBackgroundColor({
    color: "#F00",
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
        chrome.storage.sync.get(default_options, function (settings) {
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
        });
});
chrome.runtime.onInstalled.addListener(function () {
    startupTasks();
    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("contextMenu_updateAll"),
        id: "updateAll",
        contexts: ["browser_action"],
    });
    chrome.contextMenus.create({
        title: "🔗 Chrome Web Store",
        id: "cws",
        contexts: ["browser_action"],
    });
    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("webstore_addButton"),
        id: "installExt",
        documentUrlPatterns: [
            "https://chrome.google.com/webstore/detail/*",
            "https://addons.opera.com/*/extensions/details/*",
            "https://microsoftedge.microsoft.com/addons/detail/*",
        ],
    });
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.downloadId) {
        extensionsDownloads[request.downloadId] = true;
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
});
chrome.downloads.onChanged.addListener((d) => {
    if (d.endTime && extensionsDownloads[d.id]) {
        delete extensionsDownloads[d.id];
        chrome.downloads.search(
            {
                id: d.id,
            },
            (di) => {
                chrome.tabs.create({
                    url: "file:///" + di[0].filename,
                });
            }
        );
    }
});
chrome.contextMenus.onClicked.addListener(handleContextClick);

var extensionsDownloads = {};
var default_options = {
    "auto_update": true,
    "check_store_apps": true,
    "check_external_apps": true,
    "update_period_in_minutes": 60
};

function handleContextClick(info, tab) {
    if (info.menuItemId == 'updateAll')
        checkForUpdates(function (updateCheck, installed_versions, appid, updatever, is_webstore) {
            let crx_url = updateCheck.getAttribute('codebase');
            promptInstall(crx_url, is_webstore, extensionsDownloads);
        });
    else if (info.menuItemId == 'installExt')
        chrome.tabs.sendMessage(tab.id, {
            action: "install"
        });
};

function updateBadge(modified_ext_id = null) {
    checkForUpdates();
};
chrome.browserAction.setBadgeBackgroundColor({
    color: '#F00'
});
chrome.management.onInstalled.addListener(function (ext) {
    updateBadge(ext.id);
});
chrome.management.onUninstalled.addListener(function (ext) {
    updateBadge(ext.id);
});
chrome.runtime.onStartup.addListener(function () {
    chrome.storage.local.get({
        "badge_display": ""
    }, (result) => {
        chrome.browserAction.setBadgeText({
            text: result.badge_display
        });
    });
});
chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name == 'cws_check_extension_updates')
        chrome.storage.sync.get(default_options, function (settings) {
            if (settings.auto_update) {
                updateBadge();
            }
        });
});
chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("contextMenu_updateAll"),
        id: 'updateAll',
        contexts: ["browser_action"]
    });
    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("webstore_addButton"),
        id: 'installExt',
        documentUrlPatterns: ["https://chrome.google.com/webstore/detail/*"]
    });
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.downloadId) {
        extensionsDownloads[request.downloadId] = true;
    }
});
chrome.downloads.onChanged.addListener((d) => {
    if (d.endTime && extensionsDownloads[d.id]) {
        delete extensionsDownloads[d.id];
        chrome.downloads.search({
            id: d.id
        }, (di) => {
            chrome.tabs.create({
                url: 'file:///' + di[0].filename
            });
        });
    }
});
chrome.contextMenus.onClicked.addListener(handleContextClick);
chrome.storage.sync.get(default_options, function (settings) {
    chrome.alarms.get('cws_check_extension_updates', (alarm) => {
        if (!alarm || !alarm.periodInMinutes) {
            chrome.alarms.create('cws_check_extension_updates', {
                periodInMinutes: settings.update_period_in_minutes
            });
        }
    });
});

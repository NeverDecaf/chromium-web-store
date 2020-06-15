var extensionsDownloads = {};

function updateAll(info) {
    if (info.menuItemId == 'updateAll')
        checkForUpdates(function (updateCheck, installed_versions, appid, updatever, is_webstore) {
            let crx_url = updateCheck.getAttribute('codebase');
            promptInstall(crx_url, is_webstore, extensionsDownloads);
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
    updateBadge();
    chrome.alarms.create('cws_check_extension_updates', {
        periodInMinutes: 60
    });
});
chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name == 'cws_check_extension_updates')
        updateBadge();
});
chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        title: "Update All Extensions",
        id: 'updateAll',
        contexts: ["browser_action"]
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
            window.open('file://' + di[0].filename);
        });
    }
});
chrome.contextMenus.onClicked.addListener(updateAll);
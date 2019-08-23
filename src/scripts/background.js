chrome.browserAction.setBadgeBackgroundColor({
    color: '#F00'
});
function updateBadge(modified_ext_id = null) {
    chrome.storage.sync.get({
        "auto_update": true,
        "check_store_apps": true,
        "check_external_apps": true
    }, function (settings) {
        if (settings.auto_update) {
            chrome.management.getAll(function (e) {
                var chromeVersion = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1];
                var webstoreUrl = 'clients2.google.com/service/update2/crx';
                var updateUrl = 'https://clients2.google.com/service/update2/crx?response=updatecheck&acceptformat=crx2,crx3&prodversion=' + chromeVersion;
                var installed_versions = {};
                var updateUrls = [];
                e.forEach(function (ex) {
                    if (ex.updateUrl) {
                        if (webstoreUrl == ex.updateUrl.replace(/^(?:https?:\/\/)?/i, "")) {
                            updateUrl += '&x=id%3D' + ex.id + '%26uc';
                        } else {
                            updateUrls.push(ex.updateUrl);
                        }
                        installed_versions[ex.id] = ex;
                    }
                });
                updateUrls.push(updateUrl);
                function getNewXhr() {
                    var xhttp = new XMLHttpRequest();
                    xhttp.onreadystatechange = function () {
                        if (this.readyState == 4) {
                            if (this.status == 200) {
                                xmlDoc = this.responseXML;
                                var updates = xmlDoc.getElementsByTagName('app');
                                let updateCount = 0;
                                for (var i = 0; i < updates.length; i++) {
                                    if (updateCheck = updates[i].querySelector("*")) {
                                        var updatever = updateCheck.getAttribute('version');
                                        var appid = updates[i].getAttribute('appid');
                                        var is_webstore = xhttp._url == updateUrl;
                                        if (updatever && installed_versions[appid].version != updatever) {
                                            updateCount++;
                                        }
                                    }
                                }
                                chrome.browserAction.getBadgeText({}, function (currentText) {
                                    if (currentText != '?') {
                                        if (!currentText) {
                                            if (updateCount)
                                                chrome.browserAction.setBadgeText({
                                                    text: '' + updateCount
                                                });
                                        } else
                                            chrome.browserAction.setBadgeText({
                                                text: parseInt(updateCount) + parseInt(currentText) + ''
                                            });
                                    }
                                });
                            } else {
                                if (is_webstore)
                                    chrome.browserAction.setBadgeText({
                                        text: "?"
                                    });
                            }
                        }
                    };
                    xhttp.overrideMimeType('application/xml');
                    return xhttp;
                };
                chrome.browserAction.setBadgeText({
                    text: ''
                });
                updateUrls.forEach(function (uurl) {
                    if ((updateUrl == uurl && settings.check_store_apps) || (updateUrl != uurl && settings.check_external_apps)) {
                        xhr = getNewXhr();
                        xhr.open("GET", uurl, true);
                        xhr._url = uurl;
                        xhr.send();
                    }
                });
            });
        }
    });
};
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
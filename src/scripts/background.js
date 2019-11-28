chrome.browserAction.setBadgeBackgroundColor({
    color: '#F00'
});

function updateBadge(modified_ext_id = null) {
    chrome.management.getAll(function (e) {
        var default_options = {
            "auto_update": true,
            "check_store_apps": true,
            "check_external_apps": true
        };
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
            default_options[ex.id] = false;
        });
        updateUrls.push(updateUrl);

        chrome.storage.sync.get(default_options, function (settings) {
                if (settings.auto_update) {
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
                                            if (updatever && !settings[appid] && installed_versions[appid].version != updatever) {
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
                }
        });
    });
};
chrome.management.onInstalled.addListener(function (ext) {
    updateBadge(ext.id);
    console.log(ext);
});
chrome.management.onEnabled.addListener(function (ext) {
    console.log("enabled");
    console.log(ext);
});
chrome.management.onDisabled.addListener(function (ext) {
    console.log("disabled");
    console.log(ext);
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

function updateAll(info) {
    if (info.menuItemId == 'updateAll') {
        chrome.management.getAll(function (e) {
            var default_options = {
                "auto_update": true,
                "check_store_apps": true,
                "check_external_apps": true
            };
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
                default_options[ex.id] = false;
            });
            updateUrls.push(updateUrl);

            chrome.storage.sync.get(default_options, function (settings) {
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
                                        if (updatever && !settings[appid] && installed_versions[appid].version != updatever) {
                                            updateCount++;
                                            let crx_url = updateCheck.getAttribute('codebase');
                                            window.open(crx_url, '_blank');
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
                                container.appendChild(updatefailure);
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
        });
    }
};
chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        title: "Update All Extensions",
        id: 'updateAll',
        contexts: ["browser_action"]
    });
});
chrome.contextMenus.onClicked.addListener(updateAll);
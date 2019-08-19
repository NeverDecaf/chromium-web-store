chrome.browserAction.setBadgeBackgroundColor({
    color: '#F00'
});
updateBadge();
function updateBadge(modified_ext_id = null) {
    chrome.management.getAll(function (e) {
        ///////////////
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
                        for (var i = 0; i < updates.length; i++) {
                            if (updateCheck = updates[i].querySelector("*")) {
                                var updatever = updateCheck.getAttribute('version');
                                var appid = updates[i].getAttribute('appid');
                                var is_webstore = xhttp._url == updateUrl;
                                if (updatever && installed_versions[appid].version != updatever) {
                                    chrome.browserAction.getBadgeText({}, function (currentText) {
                                        if (currentText != '?') {
                                            if (!currentText)
                                                chrome.browserAction.setBadgeText({
                                                    text: '1'
                                                });
                                            else
                                                chrome.browserAction.setBadgeText({
                                                    text: parseInt(currentText) + 1 + ''
                                                });
                                        }
                                    });
                                }
                            }
                        }
                    } else {
                        document.body.innerHTML += '<h3>Update check failed!</h3>';
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
            xhr = getNewXhr();
            xhr.open("GET", uurl, true);
            xhr._url = uurl;
            xhr.send();
        });
    });
};
chrome.management.onInstalled.addListener(function (ext) {
    updateBadge(ext.id);
});
chrome.management.onUninstalled.addListener(function (ext) {
    updateBadge(ext.id);
});
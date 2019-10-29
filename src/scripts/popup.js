const container = document.getElementById("app");
const appcontainer = document.createElement("ul");
var header = document.createElement('em');
const updatefailure = document.createElement('em');
updatefailure.innerHTML = 'UPDATE CHECK FAILED';
var alluptodate = document.createElement('h1');
alluptodate.innerHTML = 'Checking for updates...';
container.appendChild(alluptodate);
container.appendChild(appcontainer);
chrome.storage.sync.get({
    "auto_update": true,
    "check_store_apps": true,
    "check_external_apps": true
}, function (settings) {
    if (!settings.check_store_apps && !settings.check_external_apps)
        alluptodate.innerHTML = 'All extensions are up to date!';
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
                                    var li = document.createElement('li');
                                    li.setAttribute('data-enabled', installed_versions[appid].enabled ? 'true' : 'false');
                                    img = document.createElement('img');
                                    img.setAttribute('alt', installed_versions[appid].name);
                                    if (installed_versions[appid].icons)
                                        img.setAttribute('src', 'chrome://extension-icon/' + appid + '/' + installed_versions[appid].icons[0].size + '/0');
                                    else
                                        img.setAttribute('src', 'chrome://extension-icon/' + appid + '/16/0');
                                    li.appendChild(img);
                                    span = document.createElement('span');
                                    span.innerHTML = installed_versions[appid].name + '<br/>(' + installed_versions[appid].version + ' => ' + updatever + ')';
                                    li.appendChild(span);
                                    li.setAttribute('title', installed_versions[appid].version + ' ⇒ ' + updatever);
                                    storepage = document.createElement('a');
                                    storepage.setAttribute('target', '_blank');
                                    storepage.innerHTML = '<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block;"><g><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"></path></g></svg>';
                                    if (is_webstore) {
                                        storepage.setAttribute('href', 'https://chrome.google.com/webstore/detail/' + appid);
                                        li.appendChild(storepage);
                                    } else if (installed_versions[appid].homepageUrl) {
                                        storepage.setAttribute('href', installed_versions[appid].homepageUrl);
                                        li.appendChild(storepage);
                                    }
                                    li.setAttribute('crx_url', updateCheck.getAttribute('codebase'));
                                    li.addEventListener("click", function (evt) {
                                        let crx_url = updateCheck.getAttribute('codebase');
                                        if (evt.target.tagName != 'A')
                                            window.open(crx_url);
                                    });
                                    appcontainer.appendChild(li);
                                    alluptodate.style.display = 'none';
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
        completed = updateUrls.length;
        updateUrls.forEach(function (uurl) {
            if ((updateUrl == uurl && settings.check_store_apps) || (updateUrl != uurl && settings.check_external_apps)) {
                xhr = getNewXhr();
                xhr.open("GET", uurl, true);
                xhr._url = uurl;
                xhr.send();
                xhr.onloadend = function () {
                    completed--;
                    if (completed == 0)
                        alluptodate.innerHTML = 'All extensions are up to date!';
                };
            }
        });
    });
});
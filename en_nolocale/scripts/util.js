const chromeVersion = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1];
const store_extensions = new Map();
const googleUpdateUrl = "https://clients2.google.com/service/update2/crx";
const WEBSTORE = { chrome: 0, edge: 1, opera: 2 };
const DEFAULT_MANAGEMENT_OPTIONS = {
    auto_update: true,
    check_store_apps: true,
    check_external_apps: true,
    update_period_in_minutes: 60,
    removed_extensions: {},
    manually_install: false,
};
var fromXML;
// prettier-ignore
!function(r){var t={"&amp;":"&","&lt;":"<","&gt;":">","&apos;":"'","&quot;":'"'};function n(r){return r&&r.replace(/^\s+|\s+$/g,"")}function s(r){return r.replace(/(&(?:lt|gt|amp|apos|quot|#(?:\d{1,6}|x[0-9a-fA-F]{1,5}));)/g,(function(r){if("#"===r[1]){var n="x"===r[2]?parseInt(r.substr(3),16):parseInt(r.substr(2),10);if(n>-1)return String.fromCharCode(n)}return t[r]||r}))}function e(r,t){if("string"==typeof r)return r;var u=r.r;if(u)return u;var a,o=function(r,t){if(r.t){for(var e,u,a=r.t.split(/([^\s='"]+(?:\s*=\s*(?:'[\S\s]*?'|"[\S\s]*?"|[^\s'"]*))?)/),o=a.length,i=0;i<o;i++){var l=n(a[i]);if(l){e||(e={});var c=l.indexOf("=");if(c<0)l="@"+l,u=null;else{u=l.substr(c+1).replace(/^\s+/,""),l="@"+l.substr(0,c).replace(/\s+$/,"");var p=u[0];p!==u[u.length-1]||"'"!==p&&'"'!==p||(u=u.substr(1,u.length-2)),u=s(u)}t&&(u=t(l,u)),f(e,l,u)}}return e}}(r,t),i=r.f,l=i.length;if(o||l>1)a=o||{},i.forEach((function(r){"string"==typeof r?f(a,"#",r):f(a,r.n,e(r,t))}));else if(l){var c=i[0];if(a=e(c,t),c.n){var p={};p[c.n]=a,a=p}}else a=r.c?null:"";return t&&(a=t(r.n||"",a)),a}function f(r,t,n){if(void 0!==n){var s=r[t];s instanceof Array?s.push(n):r[t]=t in r?[s,n]:n}}r.fromXML=fromXML=function(r,t){return e(function(r){for(var t=String.prototype.split.call(r,/<([^!<>?](?:'[\S\s]*?'|"[\S\s]*?"|[^'"<>])*|!(?:--[\S\s]*?--|\[[^\[\]'"<>]+\[[\S\s]*?]]|DOCTYPE[^\[<>]*?\[[\S\s]*?]|(?:ENTITY[^"<>]*?"[\S\s]*?")?[\S\s]*?)|\?[\S\s]*?\?)>/),e=t.length,f={f:[]},u=f,a=[],o=0;o<e;){var i=t[o++];i&&v(i);var l=t[o++];l&&c(l)}return f;function c(r){var t=r.length,n=r[0];if("/"===n)for(var s=r.replace(/^\/|[\s\/].*$/g,"").toLowerCase();a.length;){var e=u.n&&u.n.toLowerCase();if(u=a.pop(),e===s)break}else if("?"===n)p({n:"?",r:r.substr(1,t-2)});else if("!"===n)"[CDATA["===r.substr(1,7)&&"]]"===r.substr(-2)?v(r.substr(8,t-10)):p({n:"!",r:r.substr(1)});else{var f=function(r){var t={f:[]},n=(r=r.replace(/\s*\/?$/,"")).search(/[\s='"\/]/);n<0?t.n=r:(t.n=r.substr(0,n),t.t=r.substr(n));return t}(r);p(f),"/"===r[t-1]?f.c=1:(a.push(u),u=f)}}function p(r){u.f.push(r)}function v(r){(r=n(r))&&p(s(r))}}(r),t)}}("object"==typeof exports&&exports||{});
store_extensions.set(/clients2\.google\.com\/service\/update2\/crx/, {
    baseUrl:
        "https://clients2.google.com/service/update2/crx?response=updatecheck&acceptformat=crx2,crx3&prodversion=",
    name: "CWS Extensions",
});
// edge requires &v=<version> for each extension or else it returns empty results
store_extensions.set(/edge\.microsoft\.com\/extensionwebstorebase\/v1\/crx/, {
    baseUrl:
        "https://edge.microsoft.com/extensionwebstorebase/v1/crx?os=win&arch=x64&os_arch=x86_64&nacl_arch=x86-64&prod=edgecrx&prodchannel=&lang=en-US&acceptformat=crx3&prodversion=",
    name: "Edge Extensions",
    ignore: true,
});
// opera requires an opera UA or else this request will return 404
store_extensions.set(/extension-updates\.opera\.com\/api\/omaha\/update/, {
    baseUrl:
        "https://extension-updates.opera.com/api/omaha/update/?os=win&arch=x64&os_arch=x86_64&nacl_arch=x86-64&prod=chromiumcrx&prodchannel=Stable&lang=en-US&acceptformat=crx3&prodversion=",
    name: "Opera Extensions",
    userAgent: "foobar",
    ignore: true,
});

const is_cws = /chrome.google.com\/webstore/i;
const is_ows = /addons.opera.com\/.*extensions/i;
const is_ews = /microsoftedge\.microsoft\.com\/addons\//i;
const cws_re = /.*detail\/[^\/]*\/([a-z]{32})/i;
const ows_re = /.*details\/([^\/?#]+)/i;
const ews_re = /.*addons\/.+?\/([a-z]{32})/i;

const WEBSTORE_MAP = new Map();
WEBSTORE_MAP.set(is_cws, WEBSTORE.chrome);
WEBSTORE_MAP.set(is_ews, WEBSTORE.edge);
WEBSTORE_MAP.set(is_ows, WEBSTORE.opera);

function version_is_newer(current, available) {
    let current_subvs = current.split(".");
    let available_subvs = available.split(".");
    for (let i = 0; i < 4; i++) {
        let ver_diff =
            (parseInt(available_subvs[i]) || 0) -
            (parseInt(current_subvs[i]) || 0);
        if (ver_diff > 0) return true;
        else if (ver_diff < 0) return false;
    }
    return false;
}

function getExtensionId(url) {
    return (cws_re.exec(url) ||
        ows_re.exec(url) ||
        ews_re.exec(url) || [undefined, undefined])[1];
}

function buildExtensionUrl(href, extensionId = undefined) {
    extensionId = extensionId || getExtensionId(href);
    if (extensionId == undefined) return;
    if (is_cws.test(href)) {
        var chromeVersion = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1];
        return (
            "https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&prodversion=" +
            chromeVersion +
            "&x=id%3D" +
            extensionId +
            "%26installsource%3Dondemand%26uc"
        );
    }
    if (is_ows.test(href)) {
        return (
            "https://addons.opera.com/extensions/download/" + extensionId + "/"
        );
    }
    if (is_ews.test(href)) {
        return (
            "https://edge.microsoft.com/extensionwebstorebase/v1/crx?response=redirect&x=id%3D" +
            extensionId +
            "%26installsource%3Dondemand%26uc"
        );
    }
}

function promptInstall(
    crx_url,
    is_webstore,
    browser = WEBSTORE.chrome,
    custom_msg_handler = undefined
) {
    chrome.storage.sync.get(DEFAULT_MANAGEMENT_OPTIONS, function (settings) {
        var msgHandler = custom_msg_handler || chrome.runtime.sendMessage;
        if (is_webstore && !settings.manually_install) {
            switch (browser) {
                case WEBSTORE.edge:
                    // normal methods fail because microsoft's official web store redirects you from HTTPS to an insecure HTTP url.
                    // instead use chrome.tabs to open the url in a new tab.
                    msgHandler({
                        newTabUrl: crx_url,
                    });
                    break;
                case WEBSTORE.opera:
                    // Opera extensions will always error with CRX_HEADER_INVALID, they must be "load unpacked"
                    msgHandler({
                        manualInstallDownloadUrl: crx_url,
                    });
                    break;
                default:
                    // copy the edge method instead of window.open(,_blank) so this works in the service worker (mv3)
                    msgHandler({
                        newTabUrl: crx_url,
                    });
                    break;
            }
            return;
        }
        if (settings.manually_install) {
            msgHandler({
                manualInstallDownloadUrl: crx_url,
            });
            return;
        } else {
            msgHandler({
                nonWebstoreDownloadUrl: crx_url,
            });
            return;
        }
    });
}

function checkForUpdates(
    update_callback = null,
    failure_callback = null,
    completed_callback = null,
    custom_ext_list = []
) {
    chrome.management.getAll(function (e) {
        e.push(...custom_ext_list);
        let default_options = { ...DEFAULT_MANAGEMENT_OPTIONS };
        e.forEach(function (ex) {
            default_options[ex.id] = false;
        });
        chrome.storage.sync.get(default_options, function (stored_values) {
            stored_values["ignored_extensions"] = [];
            chrome.storage.managed.get(stored_values, function (settings) {
                settings.ignored_extensions.forEach((ignored_appid) => {
                    if (ignored_appid in settings)
                        settings[ignored_appid] = true;
                });
                delete settings.ignored_extensions;
                let updateUrl =
                    "https://clients2.google.com/service/update2/crx?response=updatecheck&acceptformat=crx2,crx3&prodversion=" +
                    chromeVersion;
                let installed_versions = {};
                let updateUrls = [];
                Array.from(store_extensions.values()).forEach(
                    (x) => delete x.updateUrl
                );
                e.forEach(function (ex) {
                    if (ex.updateUrl && !settings[ex.id]) {
                        let is_from_store = false;
                        for (const [re, updaterOptions] of store_extensions) {
                            if (re.test(ex.updateUrl)) {
                                is_from_store = true;
                                updaterOptions.updateUrl =
                                    updaterOptions.updateUrl ||
                                    updaterOptions.baseUrl + chromeVersion;
                                updaterOptions.updateUrl +=
                                    "&x=id%3D" + ex.id + "%26uc";
                            }
                        }
                        if (!is_from_store && settings.check_external_apps) {
                            updateUrls.push({
                                url: ex.updateUrl,
                                name: ex.name,
                                id: ex.id,
                            });
                        }
                        installed_versions[ex.id] = ex;
                    }
                });
                if (settings.check_store_apps)
                    for (const [re, updaterOptions] of store_extensions) {
                        if (!updaterOptions.ignore)
                            updateUrls.push({
                                url: updaterOptions.updateUrl,
                                name: updaterOptions.name,
                            });
                    }
                function update_extension(ext_url, ext_id, ext_name) {
                    let is_webstore = Array.from(store_extensions.keys()).some(
                        (x) => x.test(ext_url)
                    );
                    return new Promise((resolve, reject) => {
                        fetch(ext_url)
                            .then((r) => {
                                if (r.status != 200) {
                                    return Promise.reject();
                                } else return r.text();
                            })
                            .then((txt) => {
                                let xml = fromXML(txt);
                                if (xml.gupdate.app["@appid"]) {
                                    // its a single ext, put into array of size 1
                                    xml.gupdate.app = [xml.gupdate.app];
                                }
                                return xml;
                            })
                            .then((data) => {
                                let updateCount = 0;
                                for (extinfo of data?.gupdate?.app ?? []) {
                                    if (!extinfo.updatecheck) continue;
                                    let updatever =
                                        extinfo.updatecheck["@version"];
                                    let appid = extinfo["@appid"];
                                    let updatestatus =
                                        extinfo.updatecheck["@status"];
                                    if (
                                        (updatestatus == "ok" ||
                                            !is_webstore) &&
                                        updatever &&
                                        installed_versions[appid] !==
                                            undefined &&
                                        version_is_newer(
                                            installed_versions[appid].version,
                                            updatever
                                        )
                                    ) {
                                        updateCount++;
                                        if (update_callback)
                                            update_callback(
                                                extinfo.updatecheck,
                                                installed_versions,
                                                appid,
                                                updatever,
                                                is_webstore
                                            );
                                        if (
                                            appid in
                                            stored_values["removed_extensions"]
                                        ) {
                                            delete stored_values[
                                                "removed_extensions"
                                            ][appid];
                                            chrome.storage.sync.set({
                                                removed_extensions:
                                                    stored_values[
                                                        "removed_extensions"
                                                    ],
                                            });
                                        }
                                    }
                                    if (
                                        failure_callback &&
                                        updatestatus == "noupdate" &&
                                        !(
                                            appid in
                                            stored_values["removed_extensions"]
                                        )
                                    )
                                        failure_callback(
                                            true,
                                            installed_versions[appid]
                                        );
                                    // }
                                }
                                chrome.action.getBadgeText(
                                    {},
                                    function (currentText) {
                                        let disp =
                                            (updateCount || "") +
                                            (parseInt(currentText) || "") +
                                            "";
                                        chrome.action.setBadgeText(
                                            {
                                                text: disp,
                                            },
                                            () => {
                                                chrome.storage.local.set(
                                                    {
                                                        badge_display: disp,
                                                    },
                                                    () => {
                                                        resolve();
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            })
                            .catch((e) => {
                                console.error(
                                    `Error updating extension [${
                                        ext_id || ext_name
                                    }]:`,
                                    e
                                );
                                if (failure_callback) {
                                    if (ext_id)
                                        failure_callback(
                                            false,
                                            installed_versions[ext_id]
                                        );
                                    else
                                        failure_callback(false, {
                                            name: ext_name,
                                        });
                                }
                                reject();
                            });
                    });
                }
                chrome.action.setBadgeText(
                    {
                        text: "",
                    },
                    () => {
                        let promises = updateUrls
                            .filter((x) => x.url)
                            .map((uurl) =>
                                update_extension(uurl.url, uurl.id, uurl.name)
                            );
                        Promise.allSettled(promises).then((plist) => {
                            if (plist.some((x) => x.status == "rejected")) {
                                chrome.action.getBadgeText(
                                    {},
                                    function (currentText) {
                                        if (!(parseInt(currentText) > 0))
                                            chrome.action.setBadgeText({
                                                text: "?",
                                            });
                                    }
                                );
                            }
                            if (completed_callback) completed_callback();
                        });
                    }
                );
            });
        });
    });
}

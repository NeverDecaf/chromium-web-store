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

function promptInstall(crx_url, is_webstore, browser = WEBSTORE.chrome) {
    chrome.storage.sync.get(DEFAULT_MANAGEMENT_OPTIONS, function (settings) {
        if (is_webstore && !settings.manually_install) {
            switch (browser) {
                case WEBSTORE.edge:
                    // normal methods fail because microsoft's official web store redirects you from HTTPS to an insecure HTTP url.
                    // instead use chrome.tabs to open the url in a new tab.
                    chrome.runtime.sendMessage({
                        newTabUrl: crx_url,
                    });
                    break;
                case WEBSTORE.opera:
                    // use the same method as manual install, since opera crxs are not compatible with chromium.
                    chrome.runtime.sendMessage({
                        manualInstallDownloadUrl: crx_url,
                    });
                    break;
                default:
                    // copy the edge method instead of window.open(,_blank) so this works in the service worker
                    chrome.runtime.sendMessage({
                        newTabUrl: crx_url,
                    });
                    break;
            }
            return;
        }
        if (settings.manually_install) {
            chrome.runtime.sendMessage({
                manualInstallDownloadUrl: crx_url,
            });
            return;
        } else {
            chrome.runtime.sendMessage({
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
                                                updateCheck,
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
                        let promises = updateUrls.map((uurl) =>
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

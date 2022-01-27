const chromeVersion = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1];
const store_extensions = new Map();
const googleUpdateUrl = "https://clients2.google.com/service/update2/crx";
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

function promptInstall(crx_url, is_webstore, extension_dl_ids) {
    if (is_webstore) window.open(crx_url, "_blank");
    else
        chrome.downloads.download(
            {
                url: crx_url,
            },
            (dlid) => {
                if (extension_dl_ids !== undefined) extension_dl_ids[dlid] = 1;
                chrome.runtime.sendMessage({
                    downloadId: dlid,
                });
            }
        );
}

function checkForUpdates(
    update_callback = null,
    failure_callback = null,
    completed_callback = null,
    custom_ext_list = []
) {
    chrome.management.getAll(function (e) {
        e.push(...custom_ext_list);
        let default_options = {
            auto_update: true,
            check_store_apps: true,
            check_external_apps: true,
            removed_extensions: {},
        };
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
                            .then((txt) =>
                                new window.DOMParser().parseFromString(
                                    txt,
                                    "text/xml"
                                )
                            )
                            .then((data) => {
                                let updates = data.getElementsByTagName("app");
                                let updateCount = 0;
                                for (let i = 0; i < updates.length; i++) {
                                    if (
                                        (updateCheck =
                                            updates[i].querySelector("*"))
                                    ) {
                                        let updatever =
                                            updateCheck.getAttribute("version");
                                        let appid =
                                            updates[i].getAttribute("appid");
                                        let updatestatus =
                                            updateCheck.getAttribute("status");
                                        if (
                                            (updatestatus == "ok" ||
                                                !is_webstore) &&
                                            updatever &&
                                            installed_versions[appid] !==
                                                undefined &&
                                            version_is_newer(
                                                installed_versions[appid]
                                                    .version,
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
                                                stored_values[
                                                    "removed_extensions"
                                                ]
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
                                                stored_values[
                                                    "removed_extensions"
                                                ]
                                            )
                                        )
                                            failure_callback(
                                                true,
                                                installed_versions[appid]
                                            );
                                    }
                                }
                                chrome.browserAction.getBadgeText(
                                    {},
                                    function (currentText) {
                                        let disp =
                                            (updateCount || "") +
                                            (parseInt(currentText) || "") +
                                            "";
                                        chrome.browserAction.setBadgeText(
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
                chrome.browserAction.setBadgeText(
                    {
                        text: "",
                    },
                    () => {
                        let promises = updateUrls.map((uurl) =>
                            update_extension(uurl.url, uurl.id, uurl.name)
                        );
                        Promise.allSettled(promises).then((plist) => {
                            if (plist.some((x) => x.status == "rejected")) {
                                chrome.browserAction.getBadgeText(
                                    {},
                                    function (currentText) {
                                        if (!(parseInt(currentText) > 0))
                                            chrome.browserAction.setBadgeText({
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

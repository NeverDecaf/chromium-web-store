const container = document.getElementById("app");
const appcontainer = document.createElement("ul");
const removedcontainer = document.createElement("ul");
const removed_status = document.createElement("div");
const removed_text = document.createElement("p");
const update_status = document.createElement("div");
const update_text = document.createElement("p");
update_text.innerHTML = chrome.i18n.getMessage("popup_checkingForUpdates");
update_status.appendChild(update_text);
update_status.setAttribute("class", "message");
update_status.setAttribute("id", "updateStatus");
removed_text.innerHTML = chrome.i18n.getMessage("popup_removedExtensions");
removed_status.setAttribute(
    "title",
    chrome.i18n.getMessage("popup_removedExtensionsTooltip"),
);
removed_status.appendChild(removed_text);
removed_status.setAttribute("id", "removedStatus");
removed_status.setAttribute("class", "message");
removed_status.classList.add("hidden");
container.appendChild(update_status);
container.appendChild(appcontainer);
container.appendChild(removed_status);
container.appendChild(removedcontainer);

checkForUpdates(
    function (updateCheck, installed_versions, appid, updatever, is_webstore) {
        let li = document.createElement("li");
        li.setAttribute(
            "data-enabled",
            installed_versions[appid].enabled ? "true" : "false",
        );
        let img = document.createElement("img");
        img.setAttribute("alt", installed_versions[appid].name);
        if (installed_versions[appid].icons)
            img.setAttribute(
                "src",
                "chrome://extension-icon/" +
                    appid +
                    "/" +
                    installed_versions[appid].icons[0].size +
                    "/0",
            );
        else
            img.setAttribute(
                "src",
                "chrome://extension-icon/" + appid + "/16/0",
            );
        li.appendChild(img);
        span = document.createElement("span");
        span.innerHTML = installed_versions[appid].name;
        li.appendChild(span);
        li.setAttribute(
            "title",
            installed_versions[appid].version + " ⇒ " + updatever,
        );
        storepage = document.createElement("a");
        storepage.setAttribute("target", "_blank");
        storepage.innerHTML =
            '<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block;"><g><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"></path></g></svg>';
        if (is_webstore) {
            storepage.setAttribute(
                "href",
                "https://chrome.google.com/webstore/detail/" + appid,
            );
            li.appendChild(storepage);
        } else if (installed_versions[appid].homepageUrl) {
            storepage.setAttribute(
                "href",
                installed_versions[appid].homepageUrl,
            );
            li.appendChild(storepage);
        }
        li.setAttribute("crx_url", updateCheck["@codebase"]);
        let crx_url = updateCheck["@codebase"];
        li.addEventListener("click", function (evt) {
            if (evt.target.tagName != "A") promptInstall(crx_url, is_webstore);
        });
        appcontainer.appendChild(li);
        update_status.classList.add("hidden");
    },
    function (was_removed, extData) {
        let li = document.createElement("li");
        li.setAttribute("data-enabled", extData.enabled ? "true" : "false");
        li.setAttribute("class", "updatefailure");
        if ("icons" in extData) {
            let img = document.createElement("img");
            if (extData.icons)
                img.setAttribute(
                    "src",
                    "chrome://extension-icon/" +
                        extData.id +
                        "/" +
                        extData.icons[0].size +
                        "/0",
                );
            else
                img.setAttribute(
                    "src",
                    `chrome://extension-icon/${chrome.runtime.id}/16/0`,
                );
            li.appendChild(img);
        }
        let span = document.createElement("span");
        li.appendChild(span);
        if (was_removed) {
            span.innerHTML = extData.name;
            li.setAttribute("class", "removedext");
            removedcontainer.appendChild(li);
            removed_status.classList.remove("hidden");
            close_button = document.createElement("a");
            close_button.setAttribute("target", "_blank");
            close_button.innerHTML =
                '<svg class="svg-icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block;"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"></path></svg>';
            li.appendChild(close_button);
            close_button.onclick = () => {
                let default_options = {
                    removed_extensions: {},
                };
                chrome.storage.sync.get(
                    default_options,
                    function (stored_values) {
                        stored_values["removed_extensions"][extData.id] = true;
                        chrome.storage.sync.set({
                            removed_extensions:
                                stored_values["removed_extensions"],
                        });
                        li.remove();
                        if (
                            removedcontainer.getElementsByTagName("li")
                                .length == 0
                        )
                            removed_status.classList.add("hidden");
                    },
                );
            };
        } else {
            span.innerHTML = chrome.i18n.getMessage(
                "popup_updateFailed",
                extData.name,
            );
            appcontainer.appendChild(li);
            if (extData.updateUrl) {
                chrome.permissions.contains(
                    {
                        origins: [extData.updateUrl],
                    },
                    (e) => {
                        if (!e) {
                            fix_button = document.createElement("a");
                            fix_button.setAttribute("target", "_blank");
                            fix_button.innerHTML =
                                '<svg class="svg-icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block;"><path d="M4.5.257l3.771 3.771c.409 1.889-2.33 4.66-4.242 4.242l-3.771-3.77c-.172.584-.258 1.188-.258 1.792 0 1.602.607 3.202 1.83 4.426 1.351 1.351 3.164 1.958 4.931 1.821.933-.072 1.852.269 2.514.931l9.662 9.662c.578.578 1.337.868 2.097.868 1.661 0 3.001-1.364 2.966-3.03-.016-.737-.306-1.47-.868-2.033l-9.662-9.663c-.662-.661-1.002-1.581-.931-2.514.137-1.767-.471-3.58-1.82-4.93-1.225-1.224-2.825-1.83-4.428-1.83-.603 0-1.207.086-1.791.257zm17.5 20.743c0 .553-.447 1-1 1-.553 0-1-.448-1-1s.447-1 1-1 1 .447 1 1z"></path></svg>';
                            li.appendChild(fix_button);
                            fix_button.onclick = () => {
                                chrome.permissions.request({
                                    origins: [extData.updateUrl],
                                });
                            };
                        }
                    },
                );
            }
        }
    },
    function () {
        update_text.innerHTML = chrome.i18n.getMessage("popup_allUpToDate");
    },
);

const container = document.getElementById("app");
const appcontainer = document.createElement("ul");
const update_status = document.createElement('h1');
update_status.innerHTML = 'Checking for updates...';
container.appendChild(update_status);
container.appendChild(appcontainer);
checkForUpdates(function (updateCheck, installed_versions, appid, updatever, is_webstore) {
    let li = document.createElement('li');
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
    let crx_url = updateCheck.getAttribute('codebase');
    li.addEventListener("click", function (evt) {
        if (evt.target.tagName != 'A')
            promptInstall(crx_url, is_webstore);
    });
    appcontainer.appendChild(li);
    update_status.style.display = 'none';
}, function (is_webstore, ext_name) {
    let faildiv = document.createElement('h1');
    faildiv.setAttribute('class', 'updatefailure');
    faildiv.innerHTML = ext_name + ' Update Failed';
    appcontainer.appendChild(faildiv);
}, function () {
    update_status.innerHTML = 'All extensions are up to date!';
});
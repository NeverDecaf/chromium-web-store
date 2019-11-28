function load_options() {
    var maindiv = document.getElementById('updatetoggle');
    var default_options = {
        "auto_update": true,
        "check_store_apps": true,
        "check_external_apps": true
    };
    chrome.management.getAll(function (e) {
        e.forEach(function (ex) {
            label = document.createElement('label');
            label.setAttribute('title', 'Never check for updates to this extension');
            span = document.createElement('span');
            div = document.createElement('div');
            img = document.createElement('img');
            input = document.createElement('input');
            input.setAttribute('type', 'checkbox');
            input.setAttribute('id', ex.id);
            img.setAttribute('alt', ex.name);
            if (ex.icons)
                img.setAttribute('src', 'chrome://extension-icon/' + ex.id + '/' + ex.icons[0].size + '/0');
            else
                img.setAttribute('src', 'chrome://extension-icon/' + ex.id + '/16/0');
            span.innerHTML = ex.name;
            label.appendChild(input);
            label.appendChild(img);
            label.appendChild(span);
            div.appendChild(label);
            maindiv.appendChild(div);
            default_options[ex.id] = false;
        });
        chrome.storage.sync.get(default_options, function (items) {
            for (const [setting, checked] of Object.entries(items)) {
                let node = document.getElementById(setting);
                node.checked = checked;
                node.addEventListener("click", e => {
                    const checked = e.target.checked;
                    chrome.storage.sync.set({
                        [e.target.id]: checked
                    }, function () {
                        if (chrome.runtime.lastError) {
                            node.checked = !checked;
                        }
                    });
                });
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', load_options);
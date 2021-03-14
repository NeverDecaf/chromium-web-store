function load_options() {
    var maindiv = document.getElementById('updatetoggle');
    var default_options = {
        "auto_update": true,
        "check_store_apps": true,
        "check_external_apps": true,
        "update_period_in_minutes": 60
    };
    chrome.management.getAll(function (e) {
        e.forEach(function (ex) {
            label = document.createElement('label');
            label.setAttribute('title', chrome.i18n.getMessage("options_neverCheckTooltip"));
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
        chrome.storage.sync.get(default_options, function (stored_values) {
            stored_values["ignored_extensions"] = [];
            chrome.storage.managed.get(stored_values, function (items) {
                items.ignored_extensions.forEach((ignored_appid) => {
                    if (ignored_appid in items) items[ignored_appid] = true
                });
                delete items.ignored_extensions;
                for (const [setting, value] of Object.entries(items)) {
                    let node = document.getElementById(setting);
                    if (node.type == 'checkbox') {
                        node.checked = value;
                        node.addEventListener("change", e => {
                            const checked = e.target.checked;
                            chrome.storage.sync.set({
                                [e.target.id]: checked
                            }, function () {
                                if (chrome.runtime.lastError) {
                                    node.checked = !checked;
                                }
                            });
                        });
                    } else {
                        node.value = value;
                        node.addEventListener("input", e => {
                            const val = parseInt(e.target.value) || 60;
                            chrome.storage.sync.set({
                                [e.target.id]: Math.max(1, val)
                            }, function () {
                                if (chrome.runtime.lastError) {
                                    node.value = '60';
                                }
                            });
                        });
                    }
                }
                document.querySelectorAll('label.sub').forEach((node) => {
                    const target_node = node;
                    let checkbox_input = target_node.previousElementSibling.getElementsByTagName('input')[0];
                    checkbox_input.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            target_node.classList.remove('disabled');
                            for (let input of target_node.getElementsByTagName('input'))
                                input.disabled = false;
                        } else {
                            target_node.classList.add('disabled');
                            for (let input of target_node.getElementsByTagName('input'))
                                input.disabled = true;
                        }
                    });
                    if (!checkbox_input.checked) {
                        target_node.classList.add('disabled');
                        for (let input of target_node.getElementsByTagName('input'))
                            input.disabled = true;
                    }
                });
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', load_options);
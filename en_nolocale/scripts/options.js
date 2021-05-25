const googleUpdateUrl = 'https://clients2.google.com/service/update2/crx';
function load_options() {
    var maindiv = document.getElementById('updatetoggle');
    var default_options = {
        "auto_update": true,
        "check_store_apps": true,
        "check_external_apps": true,
        "update_period_in_minutes": 60
    };
    chrome.management.getAll(function (e) {
		e = e.filter(ex => ex.updateUrl)
		installed_extensions = e.map(ex => ex.id);
        e.forEach(function (ex) {
            label = document.createElement('label');
            label.setAttribute('title', "Never check for updates to this extension");
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
		let updateUrlNoScheme = googleUpdateUrl.replace(/https?:\/\//,"")
		document.getElementById('import_export_list').value = e.map(ex => {
			if (ex.updateUrl.replace(/https?:\/\//,"") == updateUrlNoScheme)
				return ex.name+'|'+ex.id
			return ex.name+'|'+ex.id+'|'+ex.updateUrl
		}).join('\r\n');
		document.getElementById('import_all_button').onclick = () => {
			let extList = [];
			for (const m of document.getElementById('import_export_list').value.matchAll(/^(.*)\|([a-z]{32})(?:\||$)(.*)$/img)) {
				if (installed_extensions.includes(m[2]))
					continue
				if (m[3])
					extList.push({name:m[1], id:m[2], updateUrl:m[3], version:"0"})
				else
					extList.push({name:m[1], id:m[2], updateUrl:googleUpdateUrl, version:"0"})
			}
			checkForUpdates(function (updateCheck, installed_versions, appid, updatever, is_webstore) {
				let crx_url = updateCheck.getAttribute('codebase');
				promptInstall(crx_url, is_webstore);
			},null,null,extList);
		}
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
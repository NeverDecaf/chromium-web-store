const default_options = {
    "auto_update": true,
    "check_store_apps": true,
    "check_external_apps": true
};
function restore_options() {
    chrome.storage.sync.get(default_options, function (items) {
        console.log(items);
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
}
document.addEventListener('DOMContentLoaded', restore_options);
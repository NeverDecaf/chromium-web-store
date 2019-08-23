const injecturl = chrome.runtime.getURL('scripts/inject.js');
window.addEventListener('DOMContentLoaded', function () {
    script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', injecturl);
    document.body.appendChild(script);
}, false);
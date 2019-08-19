var bodyObserver = new MutationObserver(function (mutations) {
    function getExtensionId(url) {
        return /.*detail\/[^\/]*\/([a-z]*)/i.exec(url)[1];
    };
    function buildExtensionUrl(extensionId) {
        var chromeVersion = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1];
        return 'https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&prodversion=' + chromeVersion + '&x=id%3D' + extensionId + '%26installsource%3Dondemand%26uc';
    };
    mutations.forEach(function (mutation) {
        if (mutation.attributeName == 'class' && mutation.target.tagName == 'DIV' && (mutation.target.className == 'a-eb-mb-x' || mutation.target.hasAttribute('webstore-source'))) {
            var xpathResult = document.evaluate('//div[div[@aria-label="Available on Chrome"] or @class="h-e-f-Ra-c e-f-oh-Md-zb-k"]', document, null, XPathResult.ANY_TYPE, null);
            var results = [];
            while (result = xpathResult.iterateNext())
                results.push(result);
            for (var i = 0; i < results.length; i++) {
                var button_div = document.createElement('div');
                button_div.setAttribute('role', 'button');
                button_div.setAttribute('class', 'dd-Va g-c-wb g-eg-ua-Uc-c-za g-c-Oc-td-jb-oa g-c');
                button_div.setAttribute('aria-label', 'Add to Chromium');
                button_div.setAttribute('tabindex', '0');
                button_div.setAttribute('style', 'user-select: none;');
                let dlurl = '';
                if (parentpanel = results[i].closest('a')) {
                    dlurl = buildExtensionUrl(getExtensionId(parentpanel.href));
                } else {
                    dlurl = buildExtensionUrl(getExtensionId(window.location.href));
                }
                var hf = document.createElement('div');
                hf.setAttribute('class', 'g-c-Hf');
                button_div.appendChild(hf);
                var x = document.createElement('div');
                x.setAttribute('class', 'g-c-x');
                hf.appendChild(x);
                var r = document.createElement('div');
                r.setAttribute('class', 'g-c-R  webstore-test-button-label');
                r.innerHTML = 'Add to Chromium';
                x.appendChild(r);
                button_div.addEventListener("mouseover", function () {
                    this.classList.add('g-c-l');
                });
                button_div.addEventListener("mouseout", function () {
                    this.classList.remove('g-c-l');
                });
                button_div.addEventListener("click", function () {
                    window.open(dlurl);
                });
                results[i].innerHTML = "";
                results[i].appendChild(button_div);
            }
        }
    });
});
bodyObserver.observe(document.body, {
    attributes: true,
    subtree: true
});
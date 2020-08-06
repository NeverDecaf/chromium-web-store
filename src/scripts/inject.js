function getExtensionId(url) {
    return /.*detail\/[^\/]*\/([a-z]*)/i.exec(url)[1];
}

function buildExtensionUrl(extensionId) {
    var chromeVersion = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1];
    return 'https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&prodversion=' + chromeVersion + '&x=id%3D' + extensionId + '%26installsource%3Dondemand%26uc';
}

function createButton(newParent) {
    var button_div = document.createElement('div');
    button_div.setAttribute('role', 'button');
    button_div.setAttribute('class', 'dd-Va g-c-wb g-eg-ua-Uc-c-za g-c-Oc-td-jb-oa g-c');
    button_div.setAttribute('aria-label', chrome.i18n.getMessage("webstore_addButton"));
    button_div.setAttribute('tabindex', '0');
    button_div.setAttribute('style', 'user-select: none;');
    var hf = document.createElement('div');
    hf.setAttribute('class', 'g-c-Hf');
    button_div.appendChild(hf);
    var x = document.createElement('div');
    x.setAttribute('class', 'g-c-x');
    hf.appendChild(x);
    var r = document.createElement('div');
    r.setAttribute('class', 'g-c-R  webstore-test-button-label');
    r.innerHTML = chrome.i18n.getMessage("webstore_addButton");
    x.appendChild(r);
    let dlurl = buildExtensionUrl(getExtensionId(window.location.href));
    button_div.addEventListener("click", function () {
        window.open(dlurl);
    });
    button_div.addEventListener("mouseover", function () {
        this.classList.add('g-c-l');
    });
    button_div.addEventListener("mouseout", function () {
        this.classList.remove('g-c-l');
    });
    newParent.innerHTML = "";
    newParent.appendChild(button_div);
}
var modifyButtonObserver = new MutationObserver(function (mutations, observer) {
    mutations.forEach(function (mutation) {
        // || used for different pages in this order: details, search results, extended search results
        if (mutation.addedNodes.length && !mutation.removedNodes.length && mutation.nextSibling == null && (mutation.addedNodes[0].className == 'f-rd' || mutation.addedNodes[0].className == 'a-eb-mb-x' || (mutation.target.className == 'h-a-x' && (!mutation.previousSibling || !mutation.previousSibling.hasAttribute('aria-labeledby'))))) {
            if (window.location.pathname.indexOf('detail') != 10 && mutation.addedNodes[0]) {
                var extensionLinks = mutation.addedNodes[0].getElementsByTagName('a');
                for (var i = 0; i < extensionLinks.length; i++) {
                    if (extensionLinks[i].getAttribute('type') == 'W') {
                        var originalButton = extensionLinks[i].querySelector('[role=button]')
                        var outerButton = originalButton.cloneNode(true);
                        originalButton.parentNode.replaceChild(outerButton, originalButton);
                        var innerButton = outerButton.querySelector('[class*=webstore-test-button-label]');
                        outerButton.setAttribute('aria-label', chrome.i18n.getMessage("webstore_addButton"));
                        innerButton.innerHTML = chrome.i18n.getMessage("webstore_addButton");
                        let dlurl = buildExtensionUrl(getExtensionId(extensionLinks[i].href));
                        outerButton.addEventListener("click", function (evt) {
                            window.open(dlurl);
                        });
                        outerButton.addEventListener("mouseover", function () {
                            this.classList.add('g-c-l');
                        });
                        outerButton.addEventListener("mouseout", function () {
                            this.classList.remove('g-c-l');
                        });
                    }
                }
            } else {
                var container_div = document.querySelector('.h-e-f-Ra-c');
                if (container_div && null == container_div.firstChild) {
                    createButton(container_div);
                }
            }
        }
    });
});
attachMainObserver = new MutationObserver(function (mutations, observer) {
    mutations.forEach(function (mutation) {
        modifyButtonObserver.observe(mutation.target.querySelector('.F-ia-k'), {
            subtree: true,
            childList: true
        });
    });
    observer.disconnect();
});
attachMainObserver.observe(document.body, {
    childList: true
});
window.onload = () => {
    chrome.runtime.onMessage.addListener(request => {
        if (request.action === "install") {
            window.open(buildExtensionUrl(getExtensionId(window.location.href)));
        }
    });
};
const is_cws = /chrome.google.com\/webstore\//i
const is_ows = /addons.opera.com\/.*extensions/i
const is_ews = /microsoftedge\.microsoft\.com\/addons\/detail\//i
const cws_re = /.*detail\/[^\/]*\/([a-z]{32})/i
const ows_re = /.*details\/([^\/?#]+)/i
const ews_re = /.*addons\/.+?\/([a-z]{32})/i

var dlBtn;

function getExtensionId(url) {
    return (cws_re.exec(url) || ows_re.exec(url) || ews_re.exec(url))[1];
}

function buildExtensionUrl(extensionId) {
	if (is_cws.test(window.location.href)) {
		var chromeVersion = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1];
		return 'https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&prodversion=' + chromeVersion + '&x=id%3D' + extensionId + '%26installsource%3Dondemand%26uc';
	}
	if (is_ows.test(window.location.href)) {
		return 'https://addons.opera.com/extensions/download/' + extensionId + '/'
	}
	if (is_ews.test(window.location.href)) {
		return 'https://edge.microsoft.com/extensionwebstorebase/v1/crx?response=redirect&x=id%3D' + extensionId + '%26installsource%3Dondemand%26uc'
	}
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
	dlBtn = button_div
}
var modifyButtonObserver = new MutationObserver(function (mutations, observer) {
    mutations.forEach(function (mutation) {
        if (mutation.addedNodes.length && !mutation.removedNodes.length && mutation.nextSibling == null && mutation.addedNodes[0].className == 'f-rd') {
            var container_div = document.querySelector('.h-e-f-Ra-c');
            if (container_div && null == container_div.firstChild) {
                createButton(container_div);
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
if (is_ews.test(window.location.href)) {
	new MutationObserver(function (mutations, observer) {
    mutations.forEach(function (mutation) {
		let btn = mutation.target.querySelector('button[disabled]')
		if (btn) {
			btn.classList.remove(btn.className.split(' ').sort().reverse()[0])
			btn.removeAttribute('disabled')
			btn.addEventListener('click',() => {
				// normal methods fail because microsoft's official web store redirects you from HTTPS to an insecure HTTP url.
				// instead use chrome.tabs to open the url in a new tab.
				chrome.runtime.sendMessage({
					newTabUrl: buildExtensionUrl(getExtensionId(window.location.href))
				});
			})
			observer.disconnect();
		}
    });
	}).observe(document.body, {
		childList: true
	});
}
if (is_cws.test(window.location.href)) {
	attachMainObserver.observe(document.body, {
		childList: true
	});
}
if (is_ows.test(window.location.href)) {
	let installDiv = document.body.querySelector('.sidebar .get-opera')
	let sidebar = installDiv.parentElement
	let wrapper = document.createElement('div')
	wrapper.classList.add('wrapper-install')
	dlBtn = document.createElement('a')
	dlBtn.classList.add('btn-install')
	dlBtn.classList.add('btn-with-plus')
	dlBtn.innerHTML = chrome.i18n.getMessage("webstore_addButton")
	sidebar.replaceChild(wrapper, installDiv)
	wrapper.appendChild(dlBtn)
	let url = buildExtensionUrl(getExtensionId(window.location.href))
	function fetchExt() {
		let filename = 'ext.crx'
		fetch(url)
		.then( r => {
			r.headers.forEach(h => {
				let v = /filename=([^ ]+)/.exec(h)
				if (v) {
					filename = v[1]
					return
				}
			})
			return r.blob()
		})
		.then( blob => {
			// set mime type to prevent automatic install; reference: https://stackoverflow.com/questions/57834691/how-to-serve-crx-file-in-a-way-that-is-not-automatically-installed
			blob = blob.slice(0, blob.size, "application/zip")
			const blobURL = window.URL.createObjectURL(blob);
			dlBtn.href = blobURL;
			dlBtn.download = filename
			dlBtn.click()
		})
	}
	dlBtn.addEventListener('click', fetchExt, {once:true})
}
window.onload = () => {
    chrome.runtime.onMessage.addListener(request => {
        if (request.action === "install") {
			console.log('opening extension URL:',buildExtensionUrl(getExtensionId(window.location.href)))
			if (is_ows.test(window.location.href)) {
				dlBtn.click()
			}
			else if (is_cws.test(window.location.href) || is_ews.test(window.location.href)) {
				window.open(buildExtensionUrl(getExtensionId(window.location.href)));
			}
        }
    });
};

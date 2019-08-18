
var bodyObserver = new MutationObserver(function (mutations) {
	
	function getExtensionId(url) {
		var pathfrags = url.split('/');
		return pathfrags[pathfrags.length-1];
	};
	function buildExtensionUrl(extensionId) {
		var chromeVersion = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1];
		return 'https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&prodversion='+chromeVersion+'&x=id%3D'+extensionId+'%26installsource%3Dondemand%26uc'
	};
	mutations.forEach(function (mutation) {
		if (mutation.attributeName == 'class' && mutation.target.tagName == 'DIV' && (mutation.target.className == 'a-eb-mb-x' || mutation.target.hasAttribute('webstore-source'))) {
		var xpathResult = document.evaluate( '//div[div[@aria-label="Available on Chrome"] or (@class="h-e-f-Ra-c e-f-oh-Md-zb-k" and not(node())) ]', document, null, XPathResult.ANY_TYPE, null);

		var results = [];
		while (result = xpathResult.iterateNext())
			results.push(result);
		
		for (var i=0; i < results.length; i++) {
			
			button_div = document.createElement( 'div' );
			button_div.setAttribute('role','button');
			button_div.setAttribute('class','dd-Va g-c-wb g-eg-ua-Uc-c-za g-c-Oc-td-jb-oa g-c');
			button_div.setAttribute('aria-label','Add to Chromium');
			button_div.setAttribute('tabindex','0');
			button_div.setAttribute('style','user-select: none;');

			hf = document.createElement( 'div' );
			hf.setAttribute('class','g-c-Hf');
			button_div.appendChild(hf);
			
			x = document.createElement( 'div' );
			x.setAttribute('class','g-c-x');
			hf.appendChild(x);
			
			R = document.createElement( 'div' );
			R.setAttribute('class','g-c-R  webstore-test-button-label');
			R.innerHTML = 'Add to Chromium';
			x.appendChild(R);
			
			button_div.addEventListener("mouseover",function(){
				this.classList.add('g-c-l');
			});
			button_div.addEventListener("mouseout",function(){
				this.classList.remove('g-c-l');
			});
			button_div.addEventListener("click",function(){
				if (this.parentElement.className == 'h-e-f-Ra-c e-f-oh-Md-zb-k')
					window.open(buildExtensionUrl(getExtensionId(document.location.href)))
				else
					window.open(buildExtensionUrl(getExtensionId(this.closest('a').href)));
			});
			
			results[i].innerHTML = "";
			results[i].appendChild( button_div );
		}
    }
  });
});

bodyObserver.observe(document.body, { attributes: true, subtree: true });

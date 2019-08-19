updateBadge();

function updateBadge (modified_ext_id = null) {
	chrome.management.getAll(function (e) {
	var chromeVersion = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1];
	var updateUrl = 'https://clients2.google.com/service/update2/crx?response=updatecheck&acceptformat=crx2,crx3&prodversion='+chromeVersion;
	var installed_versions = {};
	chrome.browserAction.setBadgeBackgroundColor({color:'#F00'});
	e.forEach(function(ex) {
		updateUrl += '&x=id%3D'+ex.id+'%26uc';
		installed_versions[ex.id] = ex;
	});
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200) {
		   xmlDoc = this.responseXML;
		   var updates = xmlDoc.getElementsByTagName('app');
		   var updatecount = 0;
		   for (var i=0; i < updates.length; i++) {
			   if (updateCheck = updates[i].firstChild) {
				   var appid = updates[i].getAttribute('appid');
				   if (appid != modified_ext_id && updateCheck.getAttribute('version') && installed_versions[appid].version != updateCheck.getAttribute('version'))
				   {
						updatecount++;
				   }
			   }
		   }
		   if (updatecount > 0)
			  chrome.browserAction.setBadgeText({text: ''+updatecount});
		   else
			  chrome.browserAction.setBadgeText({text: ''}); 
		}
		else {
			chrome.browserAction.setBadgeText({text: "?"});
		}
		}
	};
	xhttp.open("GET", updateUrl, true);
	xhttp.send();
});
};

chrome.management.onInstalled.addListener(function(ext) {
    updateBadge(ext.id);
  });

chrome.management.onUninstalled.addListener(function(ext) {
    updateBadge(ext.id);
  });

chrome.management.getAll(function (e) {
	var chromeVersion = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1];
	var updateUrl = 'https://clients2.google.com/service/update2/crx?response=updatecheck&acceptformat=crx2,crx3&prodversion='+chromeVersion;
	var installed_versions = {};
	e.forEach(function(ex) {
		updateUrl += '&x=id%3D'+ex.id+'%26uc';
		installed_versions[ex.id] = ex;
	});
	document.body.innerHTML = '<h3>Checking for updates...</h3>';
	var resulthtml = '<h3>Available Updates:</h3>';
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4) {
				if (this.status == 200) {
			   xmlDoc = this.responseXML;
			   var updates = xmlDoc.getElementsByTagName('app');
			   console.log(updates);
			   var updatecount = 0;
			   for (var i=0; i < updates.length; i++) {
				   if (updateCheck = updates[i].firstChild) {
					   var appid = updates[i].getAttribute('appid');
					   
					   if (updateCheck.getAttribute('version') && installed_versions[appid].version != updateCheck.getAttribute('version'))
					   {
						   resulthtml+='<div display="inline">';
						   resulthtml+='<a href="https://chrome.google.com/webstore/detail/'+appid+'" target="_blank">'+installed_versions[appid].name+' ('+installed_versions[appid].version+' => '+updateCheck.getAttribute('version')+')</a>';
						   resulthtml+='</div>';
						   updatecount++;
					   }
				   }
			   }
			   if (updatecount > 0)
			   {
					chrome.browserAction.setBadgeText({text: ''+updatecount});
					document.body.innerHTML = resulthtml;
			   }
			   else {
				   chrome.browserAction.setBadgeText({text: ''});
				   document.body.innerHTML = '<h3>All web store extensions up to date!</h3>';
			   }
			}
			else {
				chrome.browserAction.setBadgeText({text: "?"});
				document.body.innerHTML = '<h3>Update check failed!</h3>';
			}
			}
		};
		xhttp.open("GET", updateUrl, true);
		xhttp.send();
});

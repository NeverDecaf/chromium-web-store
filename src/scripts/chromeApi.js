// https://source.chromium.org/chromium/chromium/src/+/main:chrome/common/extensions/api/webstore_private.json
const ncws_re = /.*detail(?:\/[^\/]+)?\/([a-z]{32})/i; // copied from util.js since it's out of context
const THIS_EXT_ID = ncws_re.exec(window.location.href)[1];
const EXT_ID = document.currentScript.getAttribute("extension_id");
const port = chrome.runtime.connect(EXT_ID, { name: "windowchromeport" });
const CALLBACKS = [];
port.onMessage.addListener((msg, port) => {
	if (msg.callbackIndex !== undefined) {
		if (msg.err) {
			// "throw" error
			chrome.runtime.lastError = msg.err;
		}
		CALLBACKS[msg.callbackIndex].apply(...Array.from(msg.args));
	}
});
window.chrome.webstorePrivate = {
	getExtensionStatus: function (id, manifest, cb) {
		chrome.runtime.sendMessage(
			EXT_ID,
			{ func: "getExtensionStatus", args: [id, manifest] },
			(resp) => {
				resp.args && cb(...resp.args);
			},
		);
	},
	beginInstallWithManifest3: function (extinfo, cb) {
		chrome.runtime.sendMessage(
			EXT_ID,
			{
				func: "beginInstallWithManifest3",
				args: [extinfo, window.location.href],
			},
			(resp) => {
				resp.args && cb(...resp.args);
			},
		);
	},
	isInIncognitoMode: (cb) => cb(false), // just return false since it's likely this extension isn't running in incognito
	getReferrerChain: (cb) => cb("EgIIAA=="),
	completeInstall: function (id, cb) {
		// will never be called since we cancel all install attempts with "user_cancelled"
		// instead we rely on the onInstalled listener to continue the flow correctly (behaviour might be slightly different,
		// for example an extension installed tooltip will not show.)
		cb(true);
	},
};
window.chrome.management = {
	setEnabled: function (extId, enabled, callback) {
		port.postMessage({
			func: "setEnabled",
			args: [extId, enabled, CALLBACKS.length],
		});
		CALLBACKS.push(callback);
	},
	install: function () {
		console.log(
			"chrome.management.install not implemented, but called with args:",
			arguments,
		);
	},
	uninstall: function (extId, options, callback) {
		port.postMessage({
			func: "uninstall",
			args: [extId, options, CALLBACKS.length],
		});
		CALLBACKS.push(callback);
	},
	getAll: function (cb) {
		chrome.runtime.sendMessage(
			EXT_ID,
			{ func: "getAll", args: [THIS_EXT_ID] },
			(resp) => {
				resp.args && cb(...resp.args);
			},
		);
	},
	onInstalled: {
		addListener: function (callback) {
			port.postMessage({
				func: "onInstalled",
				args: [CALLBACKS.length],
			});
			CALLBACKS.push(callback);
		},
	},
	onUninstalled: {
		addListener: function (callback) {
			port.postMessage({
				func: "onUninstalled",
				args: [CALLBACKS.length],
			});
			CALLBACKS.push(callback);
		},
	},
};
// window.chrome.runtime.getManifest = () => true; // this is referenced in the CWS source but omitting it seems to have no effect

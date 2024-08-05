// trying to fix wallet connect issue on telegram mini app
// https://github.com/orgs/WalletConnect/discussions/4574#discussioncomment-9992027
export const patchOpen = () => {
	// @ts-ignore
	if (window.open.dirty) {
		return
	}
	window.open = (function (open) {
		const patched = function (url, _, features) {
			return open.call(window, url, '_blank', features);
		};
		patched.dirty = true;
		return patched;
	})(window.open);
};


declare global {
	interface Window {
		turnstile: any;
	}
	var turnstile: any;
}

const DEFAULT_SITE_KEY = "0x4AAAAAAA0Rmw6kZyekmiSB";

export async function getTurnstileToken(sitekey?: string){

	// Wait for script tag to load
	if (!window.turnstile){
		for (let i = 0; i<10; i++){
			await new Promise((resolve) => setTimeout(resolve, 500));
			if (window.turnstile)
				break;
		}
	}

	return new Promise((resolve, reject) => {

		if (!sitekey)
			sitekey = DEFAULT_SITE_KEY;

		const elemId = `turnstile-${sitekey}`;
		let elem;

		try {
			let widgetId;
			//if (widgetIds[sitekey] === undefined){
			if (!document.getElementById(elemId)) {
				elem = document.createElement("div");
				elem.id = elemId;
				elem.classList.add("turnstile-widget");
				document.body.getElementsByTagName("app-root")[0].append(elem);
			}
			widgetId = turnstile.render("#" + elemId, {
				sitekey,
				callback: function (token) {
					console.log(`Challenge Success ${token}`);
					resolve(token);
					turnstile.remove(widgetId);
					elem.remove();
				},
				'error-callback': function (error){
					console.error("Turnstile error: ", error);
					turnstile.remove(widgetId);
					elem.remove();
					reject(error);
				}
			});
			//widgetIds[sitekey] = widgetId;
			/*} else {
				widgetId = widgetIds[sitekey];
			}*/
		} catch (e){
			reject(e);
			if (elem)
				elem.remove();
		}
	})
}

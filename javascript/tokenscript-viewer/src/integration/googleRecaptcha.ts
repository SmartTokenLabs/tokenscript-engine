
declare global {
	interface Window {
		grecaptcha: any;
	}
	var grecaptcha: any;
}

const DEFAULT_SITE_KEY = "6LeXSIIqAAAAAJlp04ct42518YoNJeWiUtUTItTb";

const widgetIds : {[siteKey: string]: number} = {};

export async function getRecaptchaToken(sitekey?: string, action?: string){

	// Wait for script tag to load
	if (!window.grecaptcha){
		for (let i = 0; i<10; i++){
			await new Promise((resolve) => setTimeout(resolve, 500));
			if (window.grecaptcha)
				break;
		}
	}

	return new Promise((resolve, reject) => {

		if (!sitekey)
			sitekey = DEFAULT_SITE_KEY;

		grecaptcha.ready(function() {
			const elemId = `recaptcha-${sitekey}`;
			let widgetId;
			if (widgetIds[sitekey] === undefined){
				const elem = document.createElement("div");
				elem.id = elemId;
				document.body.getElementsByTagName("app-root")[0].append(elem);
				widgetId = grecaptcha.render(elemId, {
					sitekey,
					size: 'invisible'
				});
				widgetIds[sitekey] = widgetId;
			} else {
				widgetId = widgetIds[sitekey];
				const elem = document.getElementById(elemId).getElementsByClassName("grecaptcha-badge")[0] as HTMLDivElement;
				if (elem) elem.style.visibility = "visible";
			}

			grecaptcha.execute(widgetId, {action: action ?? "recaptcha"}).then(function(token) {
				resolve(token);
				setTimeout(() => {
					const elem = document.getElementById(elemId).getElementsByClassName("grecaptcha-badge")[0] as HTMLDivElement;
					if (elem) elem.style.visibility = "hidden";
				}, 5000);
			}).catch(e => {
				reject(e);
			});
		});
	})
}


export class ViewStyles {

	private static DEFAULT_ALLOWED_PROPERTIES = [
		"border-radius",
		"border",
		"border-color",
		"background",
		"background-color",
		"color",
		"padding",
		"font-family",
		"font-size",
	];

	// The keys must be valid regex
	private static ALLOWED_SELECTORS_AND_PROPERTIES = {
		// TODO: Add font-face
		"@font-face": [], // All properties allowed when empty
		"\.ts-token-container": ViewStyles.DEFAULT_ALLOWED_PROPERTIES,
		"\.ts-card-button.*": ViewStyles.DEFAULT_ALLOWED_PROPERTIES
	}

	constructor(private xml: XMLDocument) {

	}

	public getViewCss(){

		const styleElems = this.xml.getElementsByTagName("ts:style");

		if (!styleElems.length || !styleElems[0].textContent)
			return "";

		let unprocessedCss = styleElems[0].textContent;
		let processedCss = "";

		console.log(unprocessedCss);

		const propertyRegex = new RegExp("([^\{\};]+}*:[^{};]+;)\\s", "g");

		for (const [selectorRegex, allowedProperties] of Object.entries(ViewStyles.ALLOWED_SELECTORS_AND_PROPERTIES)){

			const regex = new RegExp(`${selectorRegex}(\\s*)?\{[^\}]*\}`, "g");

			const matches = unprocessedCss.match(regex);

			if (matches) {
				for (let cssRule of matches) {

					if (allowedProperties.length){
						const cssProperties = cssRule.match(propertyRegex);

						if (cssProperties) {
							for (const cssProperty of cssProperties) {

								if (!this.isPropertyAllowed(cssProperty, allowedProperties))
									cssRule = cssRule.replace(cssProperty, "");
							}
						}
					}

					processedCss += cssRule;
				}
			}
		}

		console.log(processedCss);

		return processedCss;

	}

	private isPropertyAllowed(cssProperty: string, allowedProperties: string[]){
		for (const allowedProperty of allowedProperties){
			if (cssProperty.indexOf(allowedProperty) > -1)
				return true;
		}

		return false;
	}


}

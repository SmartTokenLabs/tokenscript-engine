
export class ViewStyles {

	private static DEFAULT_ALLOWED_PROPERTIES = [
		"border-radius",
		"border",
		"border-color",
		"background",
		"background-color",
		"background-position",
		"background-size",
		"color",
		"padding",
		"font-family",
		"font-size",
		"font-weight",
		"text-transform",
		"height",
		"padding",
		"opacity"
	];

	// The keys must be valid regex
	private static ALLOWED_SELECTORS_AND_PROPERTIES = {
		// TODO: Add font-face
		"@font-face": [], // All properties allowed when empty
		"\.ts-token-background": ViewStyles.DEFAULT_ALLOWED_PROPERTIES,
		"\.bg-blur": ViewStyles.DEFAULT_ALLOWED_PROPERTIES,
		"\.ts-tokens-grid.*": [],
		"\.ts-token-container.*": ViewStyles.DEFAULT_ALLOWED_PROPERTIES,
		"\.ts-card-button.*": ViewStyles.DEFAULT_ALLOWED_PROPERTIES,
		"\.ts-action-button.*": ViewStyles.DEFAULT_ALLOWED_PROPERTIES,
		"\.ts-overflow-button.*": ViewStyles.DEFAULT_ALLOWED_PROPERTIES
	}

	constructor(private xml: XMLDocument) {

	}

	public getViewCss(){

		const styleElems = this.xml.getElementsByTagName("ts:style");

		if (!styleElems.length || !styleElems[0].textContent)
			return "";

		let unprocessedCss = styleElems[0].textContent;
		let processedCss = "";

		//console.log("Unprocessed: ", unprocessedCss);

		const propertyRegex = new RegExp("([^\{\};]+}*:[^{};]+;)\\s", "g");

		for (const [selectorRegex, allowedProperties] of Object.entries(ViewStyles.ALLOWED_SELECTORS_AND_PROPERTIES)){

			// The regex deliberately selects copies for each rule in a CSS selector list and splits them into separate rules
			// This allows easier processing of allowed properties for rule that contain different top-level selectors
			const regex = new RegExp(`${selectorRegex}(\\s*)?\{[^\}]*\}`, "g");

			const matches = unprocessedCss.match(regex);

			if (matches) {
				for (let cssRule of matches) {

					//console.log("CSS rule: ", cssRule);

					// We need to check all selectors separated by a comma, to ensure that they have the same allowed top-level selector
					// Otherwise a user can put ".ts-action-btn, body { ... }" in order to use selectors & properties not present in the whitelist
					const splitRules = cssRule.substring(0, cssRule.indexOf('{')).split(",");

					if (splitRules.length > 1){

						const commaRuleRegex = new RegExp(`(\\s*)?${selectorRegex}(\\s*)?`, "g");

						for (let i=1; i<splitRules.length; i++){
							if (!splitRules[i].match(commaRuleRegex))
								cssRule = cssRule.replace(new RegExp(`,?(\\s*)?${splitRules[i]}`, "g"), "");
						}
					}

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

		//console.log("Processed: ", processedCss);

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

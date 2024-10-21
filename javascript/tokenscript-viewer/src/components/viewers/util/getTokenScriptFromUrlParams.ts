import {AppRoot} from "../../app/app";

export async function getTokenScriptFromUrlParams(app: AppRoot, chain?: number, contract?: string, scriptId?: string, tokenScriptUrl?: string){

	if (tokenScriptUrl) {

		// TODO: Remove this fix once AlphaWallet is updated to support embedded TS viewer for newer schema versions
		if (tokenScriptUrl === "https://viewer.tokenscript.org/assets/tokenscripts/smart-cat-prod.tsml"){
			console.log("SmartCat tokenscript detected, using updated version for newer features and better performance");
			tokenScriptUrl = "/assets/tokenscripts/smart-cat-prod-2024-01.tsml";
		} else if (tokenScriptUrl === "https://viewer-staging.tokenscript.org/assets/tokenscripts/smart-cat-mumbai.tsml"){
			console.log("SmartCat tokenscript detected, using updated version for newer features and better performance");
			tokenScriptUrl = "/assets/tokenscripts/smart-cat-mumbai-2024-01.tsml";
		} else if (tokenScriptUrl === "https://viewer.tokenscript.org/assets/tokenscripts/smart-cat-loot-prod.tsml"){
			// Always use staging version on staging site
			tokenScriptUrl = "/assets/tokenscripts/smart-cat-loot-prod.tsml";
		}

		return await app.loadTokenscript("url", tokenScriptUrl);
	} else {
		const tsId = chain + "-" + contract + (scriptId ? "-" + scriptId : "");
		return await app.loadTokenscript("resolve", tsId);
	}
}

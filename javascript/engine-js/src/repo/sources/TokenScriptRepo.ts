import {ITokenScriptEngine, ScriptSourceType} from "../../IEngine";
import {SourceInterface} from "./SourceInterface";

/**
 * The TokenScript repo source accesses legacy TokenScript via a GH repo for contracts that do not support EIP-5169
 */
export class TokenScriptRepo implements SourceInterface {

	static REPO_URL = "https://raw.githubusercontent.com/AlphaWallet/TokenScript-Repo/master/aw.app/2020/06/";

	constructor(private context: ITokenScriptEngine) {

	}

	async resolveAllScripts(tsPath: string){

		if (!tsPath.match(/^[a-zA-Z0-9]*$/))
			throw new Error("Not a valid tsId for TokenScript repo");

		const uri = TokenScriptRepo.REPO_URL + tsPath + ".tsml";

		let response = await fetch(uri);

		if (response.status < 200 || response.status > 299)
			throw new Error("HTTP Error: " + response.status);

		const tokenScript = await this.context.loadTokenScript(await response.text());

		return [{
			name: tokenScript.getLabel(),
			icon: tokenScript.getMetadata().iconUrl,
			order: 0,
			authenticated: true,
			sourceId: tsPath,
			sourceUrl: uri,
			scriptId: "Repo_" + tokenScript.getName(),
			type: ScriptSourceType.URL
		}];
	}
}

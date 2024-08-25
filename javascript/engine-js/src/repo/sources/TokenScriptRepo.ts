import {ResolveResult, SourceInterface} from "./SourceInterface";
import {ScriptSourceType} from "../../Engine";

/**
 * The TokenScript repo source accesses legacy TokenScript via a GH repo for contracts that do not support EIP-5169
 */
export class TokenScriptRepo implements SourceInterface {

	static REPO_URL = "https://raw.githubusercontent.com/AlphaWallet/TokenScript-Repo/master/aw.app/2020/06/";

	async getTokenScriptXml(tsId: string): Promise<ResolveResult> {

		if (!tsId.match(/^[a-zA-Z0-9]*$/))
			throw new Error("Not a valid tsId for TokenScript repo");

		const uri = TokenScriptRepo.REPO_URL + tsId + ".tsml";

		let response = await fetch(uri);

		if (response.status < 200 || response.status > 299)
			throw new Error("HTTP Error: " + response.status);

		return {
			xml: await response.text(),
			sourceUrl: uri,
			type: ScriptSourceType.URL
		};
	}
}

import {ResolvedScriptData, ScriptInfo, SourceInterface} from "./SourceInterface";
import {TokenScriptEngine, ScriptSourceType} from "../../Engine";

/**
 * The ScriptURI source implement ethereum EIP-5169
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-5169.md
 */
export class ScriptURI implements SourceInterface {

	constructor(private context: TokenScriptEngine) {

	}

	async resolveAllScripts(tsPath: string){

		const [chain, contractAddr] = tsPath.split("-");

		if (!contractAddr || contractAddr.indexOf("0x") !== 0)
			throw new Error("Not a EIP-5169 or EIP-7738 path");

		const scripts: ScriptInfo[] = [];

		let uris = await this.context.getScriptUris(chain, contractAddr);

		if (!uris)
			throw new Error("ScriptURI is not set on this contract or chain");

		for (const [index, uri] of uris.entries()){

			const tokenScript = await this.context.getTokenScriptFromUrl(uri);

			scripts.push({
				name: tokenScript.getLabel(),
				icon: tokenScript.getMetadata().iconUrl,
				order: 0,
				authenticated: true,
				sourceId: chain + "-" + contractAddr,
				// The contracts first scriptUri acts as the default script. This is to be compatible with old data that uses tsId without a scriptId part.
				scriptId: index > 0 ? "5169_" + tokenScript.getName() : "",
				sourceUrl: uri,
				type: ScriptSourceType.SCRIPT_URI
			});
		}

		return scripts;
	}

}

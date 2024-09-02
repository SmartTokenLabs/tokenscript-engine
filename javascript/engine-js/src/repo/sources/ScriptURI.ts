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

		for (const uri of uris){

			// TODO: Download script and pull out metadata
			scripts.push({
				name: "5169",
				icon: "",
				order: 0,
				authenticated: true,
				sourceId: tsPath,
				scriptId: "5169",
				sourceUrl: uri,
				type: ScriptSourceType.SCRIPT_URI
			});
		}

		return scripts;
	}

}

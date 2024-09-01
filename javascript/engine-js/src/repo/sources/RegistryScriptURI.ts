import {ResolveResult, ScriptSource, SourceInterface} from "./SourceInterface";
import {TokenScriptEngine, ScriptSourceType} from "../../Engine";

/**
 * The ScriptURI source implement ethereum EIP-5169
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-5169.md
 */
export class RegistryScriptURI implements SourceInterface {

	constructor(private context: TokenScriptEngine) {
	}

	/**
	 * In the case of EIP-5169 and EIP-7738, tsId is a dash separated id that consists of: {$chain}-{$contractAddress}
	 * These two values are used to resolve the ScriptURI for a particular EVM contract and download the TokenScript
	 * from the resolved URL.
	 * @param tsId
	 */
	async getTokenScriptXml(tsId: string): Promise<ResolveResult> {

		const [chain, contractAddr] = tsId.split("-");

		if (!contractAddr || contractAddr.indexOf("0x") !== 0)
			throw new Error("Not a ScriptUri ID");

		// load all the scripts and script metadata
		let registryScripts: ScriptSource[] = await this.context.get7738Metadata(chain, contractAddr);

		if (registryScripts.length == 0)
			throw new Error("No Registy Entry");

		//currently user has not selected a script; pick first script
		let uri = this.context.processIpfsUrl(registryScripts[0].sourceUrl);

		let response = await fetch(uri, {
			cache: "no-store"
		});

		if (response.status < 200 || response.status > 299)
			throw new Error("HTTP Error: " + response.status);

		return {
			xml: await response.text(),
			sourceUrl: uri,
			type: ScriptSourceType.SCRIPT_REGISTRY,
			scripts: registryScripts
		};
	}

}

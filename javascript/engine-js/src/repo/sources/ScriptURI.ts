import {ResolveResult, SourceInterface} from "./SourceInterface";
import {TokenScriptEngine} from "../../Engine";

/**
 * The ScriptURI source implement ethereum EIP-5169
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-5169.md
 */
export class ScriptURI implements SourceInterface {

	constructor(private context: TokenScriptEngine) {
	}

	/**
	 * In the case of EIP-5169, tsId is a dash separated id that consists of: {$chain}-{$contractAddress}
	 * These two values are used to resolve the ScriptURI for a particular EVM contract and download the TokenScript
	 * from the resolved URL.
	 * @param tsId
	 */
	async getTokenScriptXml(tsId: string): Promise<ResolveResult> {

		const [chain, contractAddr] = tsId.split("-");

		if (!contractAddr || contractAddr.indexOf("0x") !== 0)
			throw new Error("Not a ScriptUri ID");

		let uri = await this.context.getScriptUri(chain, contractAddr);

		if (!uri)
			throw new Error("ScriptURI is not set on this contract or chain");

		console.log("Resolved ScriptURI: " + uri);

		uri = this.context.processIpfsUrl(uri);

		let response = await fetch(uri, {
			cache: "no-store"
		});

		if (response.status < 200 || response.status > 299)
			throw new Error("HTTP Error: " + response.status);

		return {
			xml: await response.text(),
			sourceUrl: uri
		};
	}

}

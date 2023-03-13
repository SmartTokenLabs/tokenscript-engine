import {ResolveResult, SourceInterface} from "./SourceInterface";
import {TokenScriptEngine} from "../../Engine";

/**
 * The ScriptURI source implement ethereum EIP-5169
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-5169.md
 */
export class ScriptURI implements SourceInterface {

	/**
	 * Public IPFS gateways are sometimes very slow, so when a custom IPFS gateway is supplied in the config,
	 * we update the following URLs to our own gateways.
	 * @private
	 */
	private IPFS_REPLACE_GATEWAYS = [
		"ipfs://",
		"https://ipfs.io/ipfs/",
		"https://gateway.pinata.cloud/ipfs/"
	];

	constructor(private context: TokenScriptEngine) {
	}

	/**
	 * In the case of EIP-5169, tsId is a dash separated id that consists of: {$chain}-{$contractAddress}
	 * These two values are used to resolve the ScriptURI for a particular EVM contract and download the TokenScript
	 * from the resolved URL.
	 * @param tsId
	 */
	async getTokenScriptXml(tsId: string): Promise<ResolveResult> {

		const provider = await this.context.getWalletAdapter();

		const [chain, contractAddr] = tsId.split("-");

		if (!contractAddr || contractAddr.indexOf("0x") !== 0)
			throw new Error("Not a ScriptUri ID");

		let uri = await provider.call(parseInt(chain), contractAddr, "scriptURI", [], ["string"]);

		if (!uri)
			throw new Error("ScriptURI is not set on this contract or chain");

		console.log("Resolved ScriptURI: " + uri);

		for (let gateway of this.IPFS_REPLACE_GATEWAYS){

			if (this.context.config.ipfsGateway.indexOf(gateway) === 0){
				continue;
			}

			if (uri.indexOf(gateway) === 0){
				uri = uri.replace(gateway, this.context.config.ipfsGateway);
				break;
			}
		}

		let response = await fetch(uri);

		if (response.status < 200 || response.status > 299)
			throw new Error("HTTP Error: " + response.status);

		return {
			xml: await response.text(),
			sourceUrl: uri
		};
	}

}

import {ITokenScriptEngine, ScriptSourceType} from "../../IEngine";
import {ScriptInfo, SourceInterface} from "./SourceInterface";

/**
 * The ScriptURI source implement ethereum EIP-5169
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-5169.md
 */
export class ScriptURI implements SourceInterface {

	constructor(private context: ITokenScriptEngine) {

	}

	async resolveAllScripts(tsPath: string){

		const [chain, contractAddr] = tsPath.split("-");

		if (!contractAddr || contractAddr.indexOf("0x") !== 0)
			throw new Error("Not a EIP-5169 or EIP-7738 path");

		const scripts: ScriptInfo[] = [];

		let uris = await this.getScriptUris(chain, contractAddr);

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

	public async getScriptUris(chain: string | number, contractAddr: string) {
		// Direct RPC gets too hammered by opensea view (that doesn't allow localStorage to cache XML)
		/*const provider = await this.getWalletAdapter();
			let uri: string|string[]|null;

			try {
				uri = Array.from(await provider.call(parseInt(chain), contractAddr, "scriptURI", [], ["string[]"])) as string[];
			} catch (e) {
				uri = await provider.call(parseInt(chain), contractAddr, "scriptURI", [], ["string"]);
			}

			if (uri && Array.isArray(uri))
				uri = uri.length ? uri[0] : null

			return <string>uri;*/

		// TODO: Add support for selecting a specific index or URL?
		// const res = await fetch(`https://api.token-discovery.tokenscript.org/script-uri?chain=${chain}&contract=${contractAddr}`);
		// const scriptUris = await res.json();
		//return <string>scriptUris[0];

		// i.e. https://store-backend.smartlayer.network/tokenscript/0xD5cA946AC1c1F24Eb26dae9e1A53ba6a02bd97Fe/chain/137/script-uri
		const res = await fetch(`https://store-backend.smartlayer.network/tokenscript/${contractAddr.toLowerCase()}/chain/${chain}/script-uri`);
		const data = await res.json();

		if (!data.scriptURI) return null;

		let uris: string[] = [];

		if (data.scriptURI.erc5169?.length) uris.push(...data.scriptURI.erc5169);

		if (data.scriptURI.offchain?.length) uris.push(...data.scriptURI.offchain);

		return uris.length ? uris : null;
	}

}

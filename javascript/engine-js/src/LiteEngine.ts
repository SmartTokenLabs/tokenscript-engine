import {Repo} from "./repo/Repo";
import {IWalletAdapter} from "./wallet/IWalletAdapter";
import {ScriptInfo} from "./repo/sources/SourceInterface";
import {IEngineConfig, ScriptSourceType, TokenScriptEngine} from "./Engine";
import {LiteTokenScript} from "./LiteTokenScript";

const DEFAULT_CONFIG: IEngineConfig = {
	ipfsGateway: "https://smart-token-labs-demo-server.mypinata.cloud/ipfs/",
	noLocalStorage: false,
	trustedKeys: []
};

/**
 * Engine.ts is the top level component for the TokenScript engine, it can be used to create a new TokenScript instance
 * via the repo, URL or directly from XML source
 */
export class LiteTokenScriptEngine implements TokenScriptEngine {

	private repo: Repo = new Repo(this);

	// TODO: Should we pass in a function or a constructor, dunno
	constructor(
		public getWalletAdapter: () => Promise<IWalletAdapter>,
		public readonly config?: IEngineConfig
	) {
		if (this.config){
			this.config = {
				...DEFAULT_CONFIG,
				...this.config
			}
		} else {
			this.config = DEFAULT_CONFIG;
		}
	}

	public resolveAllScripts(tsPath: string, forceReload = false){
		return this.repo.resolveAllScripts(tsPath, forceReload);
	}

	/**
	 * Create a new TokenScript instance from a repo source
	 * @param sourceId The unique identifier for the TokenScript file
	 * @param forceRefresh Bypass resolver cache and re-resolve this contracts TokenScripts
	 */
	public async getTokenScript(sourceId: string, forceRefresh = false){

		const resolveResult = await this.repo.getTokenScript(sourceId, forceRefresh);

		const {xml, ...sourceInfo} = resolveResult;

		return await this.initializeTokenScriptObject(resolveResult.xml, resolveResult.type, resolveResult.sourceId, resolveResult.sourceUrl, sourceInfo);
	}

	/**
	 * Create a new TokenScript instance from a URL source
	 * @param url Source URL for the TokenScript
	 */
	public async getTokenScriptFromUrl(url: string){

		url = this.processIpfsUrl(url);


		// TODO: Add caching for URL loaded tokenscripts, add URL source to repo
		const res = await fetch(url, {
			cache: "no-store"
		});

		if (res.status < 200 || res.status > 399){
			throw new Error("Failed to load URL: " + res.statusText);
		}

		let tsType: ScriptSourceType = ScriptSourceType.URL;

		return await this.initializeTokenScriptObject(await res.text(), tsType, url, url, null);
	}

	// TODO: The engine should hold the tokenscript object in memory until explicitly cleared, or done so via some intrinsic.
	//		This will allow TokenScripts to call other TokeScripts via their external API
	/**
	 * Create a new TokenScript instance from raw XML
	 * @param xml XML string
	 * @param sourceType
	 * @param sourceId
	 * @param sourceUrl
	 */
	public async loadTokenScript(xml: string) {

		return await this.initializeTokenScriptObject(xml, ScriptSourceType.UNKNOWN, undefined, undefined, undefined);
	}

	/**
	 * Instantiate a new TokenScript object
	 * @param xml
	 * @param source
	 * @param sourceId
	 * @param sourceUrl
	 * @param scriptInfo
	 * @private
	 */
	private async initializeTokenScriptObject(xml: string, source: ScriptSourceType, sourceId: string, sourceUrl?: string, scriptInfo?: ScriptInfo){
		try {
			let parser
			if (typeof window === 'undefined'){
				const {JSDOM} = await import("jsdom");
				const jsdom = new JSDOM();
				parser = new jsdom.window.DOMParser();
			} else {
				parser = new DOMParser();
			}
			let tokenXml = parser.parseFromString(xml,"text/xml");

			return new LiteTokenScript(this, tokenXml, xml, source, sourceId, sourceUrl, scriptInfo);
		} catch (e){
			throw new Error("Failed to parse tokenscript definition: " + e.message);
		}
	}

	/**
	 * Sign a personal message using the Ethereum WalletAdapter implementation provided by the user-agent
	 * @param data
	 */
	public async signPersonalMessage(data) {

		try {
			return await (await this.getWalletAdapter()).signPersonalMessage(data);
		} catch (e){
			throw new Error("Signing failed: " + e.message);
		}
	}

	// TODO: This should probably be moved somewhere else
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

	public processIpfsUrl(uri: string){

		for (let gateway of this.IPFS_REPLACE_GATEWAYS){

			if (this.config.ipfsGateway.indexOf(gateway) === 0){
				continue;
			}

			if (uri.indexOf(gateway) === 0){
				uri = uri.replace(gateway, this.config.ipfsGateway);
				break;
			}
		}

		return uri;
	}

	public async getScriptUris(chain: string|number, contractAddr: string) {

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

		if (!data.scriptURI)
			return null;

		let uris: string[] = [];

		if (data.scriptURI.erc5169?.length)
			uris.push(...data.scriptURI.erc5169);

		if (data.scriptURI.offchain?.length)
			uris.push(...data.scriptURI.offchain);

		return uris.length ? uris : null;
	}

}

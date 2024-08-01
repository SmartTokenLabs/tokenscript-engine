import {Repo} from "./repo/Repo";
import {TokenScript} from "./TokenScript";
import {IWalletAdapter} from "./wallet/IWalletAdapter";
import {ITokenDiscoveryAdapter} from "./tokens/ITokenDiscoveryAdapter";
import {IViewBinding} from "./view/IViewBinding";
import {AttestationManager} from "./attestation/AttestationManager";
import {IAttestationStorageAdapter} from "./attestation/IAttestationStorageAdapter";
import {AttestationDefinition} from "./tokenScript/attestation/AttestationDefinition";
import {TrustedKey} from "./security/TrustedKeyResolver";
import {ILocalStorageAdapter} from "./view/data/ILocalStorageAdapter";
import {ITxValidationInfo} from "./security/TransactionValidator";

export interface IEngineConfig {
	ipfsGateway?: string
	noLocalStorage?: boolean
	trustedKeys?: TrustedKey[], // Define signing keys which are always valid
	txValidationCallback?: (txInfo: ITxValidationInfo) => boolean|Promise<boolean>;
}

const DEFAULT_CONFIG: IEngineConfig = {
	ipfsGateway: "https://smart-token-labs-demo-server.mypinata.cloud/ipfs/",
	noLocalStorage: false,
	trustedKeys: []
};

export enum ScriptSourceType {
	SCRIPT_URI = "scriptUri",
	URL = "url",
	UNKNOWN = "unknown",
}

/**
 * Engine.ts is the top level component for the TokenScript engine, it can be used to create a new TokenScript instance
 * via the repo, URL or directly from XML source
 */
export class TokenScriptEngine {

	private repo: Repo = new Repo(this);
	private attestationManager?: AttestationManager;

	// TODO: Should we pass in a function or a constructor, dunno
	constructor(
		public getWalletAdapter: () => Promise<IWalletAdapter>,
		public getTokenDiscoveryAdapter?: () => Promise<ITokenDiscoveryAdapter>,
		public getAttestationStorageAdapter?: () => IAttestationStorageAdapter,
		public getLocalStorageAdapter?: () => ILocalStorageAdapter,
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

		if (this.getAttestationStorageAdapter)
			this.attestationManager = new AttestationManager(this, this.getAttestationStorageAdapter());
	}

	public getAttestationManager(){
		if (!this.attestationManager)
			throw new Error("Attestation storage adapter not provided");

		return this.attestationManager;
	}

	public async importAttestationUsingTokenScript(urlParams: URLSearchParams): Promise<{definition: AttestationDefinition, tokenScript: TokenScript}> {

		// const url = new URL(magicLink);
		// const urlParams = new URLSearchParams(url.hash.substring(1) ?? url.search.substring(1));

		// Read attestation from magic link
		const attestation = await this.getAttestationManager().readMagicLink(urlParams);

		let scriptUri;

		if (urlParams.has("scriptURI")){
			scriptUri = urlParams.get("scriptURI");
		} else {
			const attestData = await attestation.getAttestationData();

			if (attestData.scriptURI){
				scriptUri = attestData.scriptURI;
			} else {
				throw new Error("scriptURI parameter not provided");
			}
		}

		// Load tokenScript
		const tokenScript = await this.getTokenScriptFromUrl(this.processIpfsUrl(scriptUri));

		// TODO: Remove - only here for debugging
		// const data = await attestation.getAttestationData()
		// console.log("Attestation data: ", data);

		const attestationDefs = tokenScript.getAttestationDefinitions();

		// Read through attestation definitions and find the one that matches the attestation
		for (const definition of attestationDefs){

			const collectionHash = await attestation.getCollectionHash(definition);
			const collectionHashes = definition.calculateAttestationCollectionHashes();

			// Match collection hashes
			if (collectionHashes.indexOf(collectionHash) === -1)
				continue

			console.log("Successfully matched collection hash to tokenscript attestation definition!");

			// Match found, store attestation
			await this.attestationManager.saveAttestation(definition, attestation);

			return {definition, tokenScript}
		}

		throw new Error("The provided TokenScript does not contain an attestation definition for the included attestation.");
	}

	/**
	 * Create a new TokenScript instance from a repo source
	 * @param tsId The unique identifier for the TokenScript file
	 * @param viewBinding The view binding implementation to be used for this TokenScript
	 * @param forceRefresh Bypass cache and re-resolve the TokenScript XML
	 */
	public async getTokenScript(tsId: string, viewBinding?: IViewBinding, forceRefresh?: true){

		const resolveResult = await this.repo.getTokenScript(tsId, forceRefresh);

		return await this.initializeTokenScriptObject(resolveResult.xml, ScriptSourceType.SCRIPT_URI, tsId, resolveResult.sourceUrl, viewBinding);
	}

	/**
	 * Create a new TokenScript instance from a URL source
	 * @param url Source URL for the TokenScript
	 * @param viewBinding The view binding implementation to be used for this TokenScript
	 */
	public async getTokenScriptFromUrl(url: string, viewBinding?: IViewBinding){

		// TODO: Add caching for URL loaded tokenscripts, add URL source to repo
		const res = await fetch(url, {
			cache: "no-store"
		});

		if (res.status < 200 || res.status > 399){
			throw new Error("Failed to load URL: " + res.statusText);
		}

		return await this.initializeTokenScriptObject(await res.text(), ScriptSourceType.URL, url, url, viewBinding);
	}

	// TODO: The engine should hold the tokenscript object in memory until explicitly cleared, or done so via some intrinsic.
	//		This will allow TokenScripts to call other TokeScripts via their external API
	/**
	 * Create a new TokenScript instance from raw XML
	 * @param xml XML string
	 * @param viewBinding The view binding implementation to be used for this TokenScript
	 * @param sourceType
	 * @param sourceId
	 * @param sourceUrl
	 */
	public async loadTokenScript(xml: string, viewBinding?: IViewBinding, sourceType: ScriptSourceType = ScriptSourceType.UNKNOWN, sourceId?: string, sourceUrl?: string) {

		return await this.initializeTokenScriptObject(xml, sourceType, sourceId, sourceUrl, viewBinding);
	}

	/**
	 * Instantiate a new TokenScript object
	 * @param xml
	 * @param source
	 * @param sourceId
	 * @param sourceUrl
	 * @param viewBinding
	 * @private
	 */
	private async initializeTokenScriptObject(xml: string, source: ScriptSourceType, sourceId: string, sourceUrl?: string, viewBinding?: IViewBinding){
		try {
			let parser
			if ((typeof process !== 'undefined') && (process.release.name === 'node')){
				const {JSDOM} = await import("jsdom");
				const jsdom = new JSDOM();
				parser = new jsdom.window.DOMParser();
			} else {
				parser = new DOMParser();
			}
			let tokenXml = parser.parseFromString(xml,"text/xml");
			return new TokenScript(this, tokenXml, xml, source, sourceId, sourceUrl, viewBinding);
		} catch (e){
			this.repo.deleteTokenScript(sourceId); // TODO: Move parsing to repo so that this isn't required
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

	public async getScriptUri(chain: string, contractAddr: string) {

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

		if (data.scriptURI.erc5169?.length)
			return <string>data.scriptURI.erc5169[0];

		if (data.scriptURI.offchain?.length)
			return <string>data.scriptURI.offchain[0];

		return null;
	}
}

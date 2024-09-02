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
import {ScriptSource} from "./repo/sources/SourceInterface";

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
	SCRIPT_REGISTRY = "registry",
	SCRIPT_URI = "scriptUri",
	URL = "url",
	UNKNOWN = "unknown",
}

// Development deployment of 7738 on Holesky only
// TODO: Replace with multichain address once available
export const HOLESKY_DEV_7738 = "0x29a27A5D74Fe8ff01E2dA8b9fC64061A3DFBEe14";
const HOLESKY_ID = 17000; // TODO: Source this from engine
const cacheTimeout = 60 * 1000; // 1 minute cache validity

//cache entries
export interface ScriptEntry {
	scriptURIs: string[];
	timeStamp: number;
}

export interface RegistryMetaData {
	scriptData: ScriptSource[];
	timeStamp: number;
}

const cachedResults = new Map<string, ScriptEntry>();
const cachedMetaDataResults = new Map<string, RegistryMetaData>();

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

		let scriptTokenId = "0";

		// select first registry script if loading with no pre-select
		if (resolveResult.type == ScriptSourceType.SCRIPT_REGISTRY && resolveResult.scripts.length > 0) {
			scriptTokenId = resolveResult.scripts[0].tokenId.toString();
		}

		return await this.initializeTokenScriptObject(resolveResult.xml, resolveResult.type, tsId, resolveResult.sourceUrl, viewBinding, resolveResult.scripts, scriptTokenId);
	}

	/**
	 * Create a new TokenScript instance from a URL source
	 * @param url Source URL for the TokenScript
	 * @param viewBinding The view binding implementation to be used for this TokenScript
	 */
	public async getTokenScriptFromUrl(url: string, viewBinding?: IViewBinding, chain?: string, contractAddr?: string, selectionIdToken?: string){

		url = this.processIpfsUrl(url);

		let registryScripts = [];

		// TODO: Add caching for URL loaded tokenscripts, add URL source to repo
		const res = await fetch(url, {
			cache: "no-store"
		});

		if (res.status < 200 || res.status > 399){
			throw new Error("Failed to load URL: " + res.statusText);
		}

		let tsType: ScriptSourceType = ScriptSourceType.URL;

		//load scripts if this is a registry entry
		if (chain != undefined && contractAddr != undefined) {
			// We still need to load all the available scripts for selection purposes (eg 5169 scriptURI if also available)
			const resolveResult = await this.repo.getTokenScript(`${chain}-${contractAddr}`, false);
			registryScripts = resolveResult.scripts;
			tsType = ScriptSourceType.SCRIPT_REGISTRY;
		}

		return await this.initializeTokenScriptObject(await res.text(), tsType, url, url, viewBinding, registryScripts, selectionIdToken);
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
	private async initializeTokenScriptObject(xml: string, source: ScriptSourceType, sourceId: string, sourceUrl?: string, viewBinding?: IViewBinding, 
		scripts?: ScriptSource[], selectionTokenId?: string){
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
			let selectionId = selectionTokenId != undefined ? Number(selectionTokenId) : 0;
			return new TokenScript(this, tokenXml, xml, source, sourceId, sourceUrl, viewBinding, scripts, selectionId);
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

	// This returns all entries but the 7738 calling function currently selects the first entry
	// TODO: Create selector that displays icon and name for each entry, in order returned
	// TODO: Use global deployed address for 7738
	public async get7738Entry(chain: string, contractAddr: string): Promise<string[]> {

		// use 1 minute persistence fetch cache
		let cachedResult = this.checkCachedResult(chain, contractAddr);

		if (cachedResult.length > 0) {
			return cachedResult;
		}

		const chainId: number = parseInt(chain);

		// TODO: Remove once universal chain deployment is available
		if (chainId != HOLESKY_ID) {
			return [];
		}

		const provider = await this.getWalletAdapter();
		let uri: string|string[]|null;

		try {
			uri = Array.from(await provider.call(
				chainId, HOLESKY_DEV_7738, "scriptURI", [
					{
						internalType: "address",
						name: "",
						type: "address",
						value: contractAddr
					}], ["string[]"]
			)) as string[];
		} catch (e) {
			uri = "";
		}

		if (uri && Array.isArray(uri) && uri.length > 0) {	  
			this.storeResult(chain, contractAddr, uri);
			return uri;
		} else {
			return [];
		}
	}
	
	public async get7738Metadata(chain: string, contractAddr: string): Promise<ScriptSource[]> {

		const chainId: number = parseInt(chain);

		// TODO: Remove once universal chain deployment is available
		if (chainId != HOLESKY_ID) {
			return [];
		}

		// use 1 minute persistence fetch cache
		let cachedResult = this.checkCachedMetaData(chain, contractAddr);

		if (cachedResult.length > 0) {
			return cachedResult;
		}

		const provider = await this.getWalletAdapter();
		let scriptSourceData: any;

		try {
			scriptSourceData = Array.from(await provider.call(
				chainId, HOLESKY_DEV_7738, "scriptData", [
					{
						internalType: "address",
						name: "contractAddress",
						type: "address",
						value: contractAddr
					}], 
					[{
						"components": [
						  {
							internalType: "string",
							name: "name",
							type: "string"
						  },
						  {
							internalType: "string",
							name: "iconURI",
							type: "string"
						  },
						  {
							internalType: "uint",
							name: "tokenId",
							type: "uint"
						  },
						  {
							internalType: "string",
							name: "scriptURI",
							type: "string"
						  },
						  {
							internalType: "bool",
							name: "isAuthenticated",
							type: "bool"
						  }
						],
						"internalType": "struct ScriptData[]",
						"name": "",
						"type": "tuple[]"
					  }]
			));
		} catch (e) {
			scriptSourceData = [];
		}

		let sourceElements: ScriptSource[] = [];

		//build array
		for (let i = 0; i < scriptSourceData?.length; i++) {
			const thisSourceData = scriptSourceData[i];

			sourceElements.push({
				name: thisSourceData.name,
				icon: this.processIpfsUrl(thisSourceData.iconURI),
				order: i+1,
				authenticated: thisSourceData.isAuthenticated,
				tokenId: typeof thisSourceData.tokenId === 'bigint' ? Number(thisSourceData.tokenId) : thisSourceData.tokenId,
				sourceUrl: thisSourceData.scriptURI,
				type: ScriptSourceType.SCRIPT_REGISTRY
			});
		}

		return sourceElements;
	}

	private storeResult(chain: string, contractAddr: string, uris: string[]) {
		// remove out of date entries
		cachedResults.forEach((value, key) => {
			if (value.timeStamp < (Date.now() - cacheTimeout)) {
				cachedResults.delete(key);
			}
		});

		cachedResults.set(chain + "-" + contractAddr, {
			scriptURIs: uris,
			timeStamp: Date.now()
		});
	}

	private checkCachedResult(chain: string, contractAddress: string): string[] {
		const key = chain + "-" + contractAddress;
		const mapping = cachedResults.get(key);
		if (mapping) {
			if (mapping.timeStamp < (Date.now() - cacheTimeout)) {
				//out of date result, remove key
				cachedResults.delete(key);
				return []
			} else {
				//consoleLog("Can use cache");
				return mapping.scriptURIs;
			}
		} else {
			return [];
		}
	}

	private checkCachedMetaData(chain: string, contractAddress: string): ScriptSource[] {
		const key = chain + "-" + contractAddress;
		this.removeOutOfDateEntries();
		const mapping = cachedMetaDataResults.get(key);
		if (mapping) {
			return mapping.scriptData;
		} else {
			return [];
		}
	}

	//ensure memory usage is kept to a minimum
	private removeOutOfDateEntries() {
		const currentTime = Date.now();
		for (const [key, value] of cachedMetaDataResults) {
			if (currentTime - value.timeStamp > cacheTimeout) {
				cachedMetaDataResults.delete(key);
			}
		}
	}
}

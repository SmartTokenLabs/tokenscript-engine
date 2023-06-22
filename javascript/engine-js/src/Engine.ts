import {Repo} from "./repo/Repo";
import {TokenScript} from "./TokenScript";
import {IWalletAdapter} from "./wallet/IWalletAdapter";
import {ITokenDiscoveryAdapter} from "./tokens/ITokenDiscoveryAdapter";
import {IViewBinding} from "./view/IViewBinding";
import {AttestationManager} from "./attestation/AttestationManager";
import {IAttestationStorageAdapter} from "./attestation/IAttestationStorageAdapter";

export interface IEngineConfig {
	ipfsGateway: string
}

const DEFAULT_CONFIG: IEngineConfig = {
	ipfsGateway: "https://ipfs.io/ipfs/"
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
		public config?: IEngineConfig
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

	public async importAttestationUsingTokenScript(urlParams: URLSearchParams): Promise<TokenScript> {

		// const url = new URL(magicLink);
		// const urlParams = new URLSearchParams(url.hash.substring(1) ?? url.search.substring(1));

		if (!urlParams.has("scriptURI"))
			throw new Error("scriptURI parameter not provided");

		// Read attestation from magic link
		const attestation = await this.getAttestationManager().readMagicLink(urlParams);

		// Load tokenScript
		const tokenScript = await this.getTokenScriptFromUrl(urlParams.get("scriptURI"));

		// TODO: Remove - only here for debugging
		// const data = await attestation.getAttestationData()
		// console.log("Attestation data: ", data);

		const collectionHash = await attestation.getCollectionHash();
		const attestationDefs = tokenScript.getAttestationDefinitions();

		// Read through attestation definitions and find the one that matches the attestation
		for (const definition of attestationDefs){

			const collectionHashes = definition.calculateAttestationCollectionHashes();

			// Match collection hashes
			if (collectionHashes.indexOf(collectionHash) === -1)
				continue

			console.log("Successfully matched collection hash to tokenscript attestation definition!");

			// Match found, store attestation
			await this.attestationManager.saveAttestation(definition, attestation);

			return tokenScript
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

		return this.initializeTokenScriptObject(resolveResult.xml, ScriptSourceType.SCRIPT_URI, tsId, resolveResult.sourceUrl, viewBinding);
	}

	/**
	 * Create a new TokenScript instance from a URL source
	 * @param url Source URL for the TokenScript
	 * @param viewBinding The view binding implementation to be used for this TokenScript
	 */
	public async getTokenScriptFromUrl(url: string, viewBinding?: IViewBinding){

		// TODO: Add caching for URL loaded tokenscripts, add URL source to repo
		const res = await fetch(url);

		if (res.status < 200 || res.status > 399){
			throw new Error("Failed to load URL: " + res.statusText);
		}

		return this.initializeTokenScriptObject(await res.text(), ScriptSourceType.URL, url, url, viewBinding);
	}

	// TODO: The engine should hold the tokenscript object in memory until explicitly cleared, or done so via some intrinsic.
	//		This will allow TokenScripts to call other TokeScripts via their external API
	/**
	 * Create a new TokenScript instance from raw XML
	 * @param xml XML string
	 * @param viewBinding The view binding implementation to be used for this TokenScript
	 */
	public async loadTokenScript(xml: string, viewBinding?: IViewBinding) {

		return this.initializeTokenScriptObject(xml, ScriptSourceType.UNKNOWN, null, null, viewBinding);
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
	private initializeTokenScriptObject(xml: string, source: ScriptSourceType, sourceId: string, sourceUrl?: string, viewBinding?: IViewBinding){
		try {
			let parser = new DOMParser();
			let tokenXml = parser.parseFromString(xml,"text/xml");
			return new TokenScript(this, tokenXml, xml, source, sourceId, sourceUrl, viewBinding);
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
}

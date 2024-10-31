import {AbstractTokenScriptEngine} from "./AbstractEngine";
import {AttestationManager} from "./attestation/AttestationManager";
import {IAttestationStorageAdapter} from "./attestation/IAttestationStorageAdapter";
import {IEngineConfig, ScriptSourceType} from "./IEngine";
import {ScriptInfo} from "./repo/sources/SourceInterface";
import {ITokenDiscoveryAdapter} from "./tokens/ITokenDiscoveryAdapter";
import {TokenScript} from "./TokenScript";
import {AttestationDefinition} from "./tokenScript/attestation/AttestationDefinition";
import {ILocalStorageAdapter} from "./view/data/ILocalStorageAdapter";
import {IViewBinding} from "./view/IViewBinding";
import {IWalletAdapter} from "./wallet/IWalletAdapter";
import {ITlinkAdapter} from "./tlink/ITlinkAdapter";

/**
 * Engine.ts is the top level component for the TokenScript engine, it can be used to create a new TokenScript instance
 * via the repo, URL or directly from XML source
 */
export class TokenScriptEngine extends AbstractTokenScriptEngine {
	private attestationManager?: AttestationManager;

	// TODO: Should we pass in a function or a constructor, dunno
	constructor(
		getWalletAdapter: () => Promise<IWalletAdapter>,
		public getTokenDiscoveryAdapter?: () => Promise<ITokenDiscoveryAdapter>,
		public getAttestationStorageAdapter?: () => IAttestationStorageAdapter,
		public getLocalStorageAdapter?: () => ILocalStorageAdapter,
		config?: IEngineConfig
	) {
		super(getWalletAdapter, config);

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
	 * @param sourceId The unique identifier for the TokenScript file
	 * @param viewBinding The view binding implementation to be used for this TokenScript
	 * @param forceRefresh Bypass resolver cache and re-resolve this contracts TokenScripts
	 */
	public async getTokenScript(sourceId: string, viewBinding?: IViewBinding, forceRefresh = false){

		const resolveResult = await this.repo.getTokenScript(sourceId, forceRefresh);

		const {xml, ...sourceInfo} = resolveResult;

		return await this.initializeTokenScriptObject(resolveResult.xml, resolveResult.type, resolveResult.sourceId, resolveResult.sourceUrl, sourceInfo, viewBinding);
	}

	/**
	 * Create a new TokenScript instance from a URL source
	 * @param url Source URL for the TokenScript
	 * @param viewBinding The view binding implementation to be used for this TokenScript
	 */
	public async getTokenScriptFromUrl(url: string, viewBinding?: IViewBinding){

		url = this.processIpfsUrl(url);


		// TODO: Add caching for URL loaded tokenscripts, add URL source to repo
		const res = await fetch(url, {
			cache: "no-store"
		});

		if (res.status < 200 || res.status > 399){
			throw new Error("Failed to load URL: " + res.statusText);
		}

		let tsType: ScriptSourceType = ScriptSourceType.URL;

		return await this.initializeTokenScriptObject(await res.text(), tsType, url, url, null, viewBinding);
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

		return await this.initializeTokenScriptObject(xml, sourceType, sourceId, sourceUrl, null, viewBinding);
	}

	/**
	 * Instantiate a new TokenScript object
	 * @param xml
	 * @param source
	 * @param sourceId
	 * @param sourceUrl
	 * @param scriptInfo
	 * @param viewBinding
	 * @private
	 */
	private async initializeTokenScriptObject(xml: string, source: ScriptSourceType, sourceId: string, sourceUrl?: string, scriptInfo?: ScriptInfo, viewBinding?: IViewBinding){
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

			return new TokenScript(this, tokenXml, xml, source, sourceId, sourceUrl, scriptInfo, viewBinding);
		} catch (e){
			throw new Error("Failed to parse tokenscript definition: " + e.message);
		}
	}
}

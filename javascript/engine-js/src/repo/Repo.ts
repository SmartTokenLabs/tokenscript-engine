import {ITokenScriptEngine} from "../IEngine";
import {RegistryScriptURI} from "./sources/RegistryScriptURI";
import {ScriptURI} from "./sources/ScriptURI";
import {ResolvedScriptData, ScriptInfo, SourceInterfaceConstructor} from "./sources/SourceInterface";
import {TokenScriptRepo} from "./sources/TokenScriptRepo";
import {LaunchpadAPI} from "./sources/LaunchpadAPI";

type ScriptLookupCache = {[chainAndContract: string]: {scripts: ScriptInfo[], timestamp: number}};

/**
 * Repo.ts is class that is used to resolve TokenScripts from various sources and cache them in localStorage
 */
export class Repo {

	/**
	 * Any number of sources can be defined and their order changed.
	 */
	static REPO_SOURCES: SourceInterfaceConstructor[] = [
		ScriptURI,
		RegistryScriptURI,
		LaunchpadAPI,
		TokenScriptRepo
	];

	/**
	 * Repo cache TTL in seconds
	 */
	static REPO_TTL = 3600;

	static LOCAL_STORAGE_KEY = "ts-resolver-cache";

	private scriptLookupCache: ScriptLookupCache = {};

	constructor(protected context: ITokenScriptEngine) {
		if (this.context.config.noLocalStorage)
			return;

		try {
			const tsStr = localStorage.getItem(Repo.LOCAL_STORAGE_KEY);

			if (tsStr)
				this.scriptLookupCache = JSON.parse(tsStr) as ScriptLookupCache;

			// TODO: This is just to remove old records from before when we stored XML in local storage (bad idea)
			for (let i=0; i<localStorage.length; i++){
				const key = localStorage.key(i);
				if (key.indexOf("ts-") === 0 &&
					[Repo.LOCAL_STORAGE_KEY, "ts-wallet-connections"].indexOf(key) === -1
				){
					localStorage.removeItem(key);
				}
			}
		} catch (e){
			// no-op
		}
	}

	/**
	 * Resolves a list of script entries for this chain & contract.
	 * @param tsPath
	 * @param forceRefresh
	 */
	public async resolveAllScripts(tsPath: string, forceRefresh = false): Promise<ScriptInfo[]> {

		if (!forceRefresh && this.scriptLookupCache[tsPath] && (Date.now() < this.scriptLookupCache[tsPath].timestamp + (Repo.REPO_TTL * 1000)))
			return this.scriptLookupCache[tsPath].scripts;

		const scripts = [];

		for (let resolver of Repo.REPO_SOURCES){
			try {
				scripts.push(...await (new resolver(this.context)).resolveAllScripts(tsPath));
			} catch (e) {
				console.warn("Failed to resolve tokenscripts using resolver: " + resolver.name, e);
			}
		}

		if (!scripts.length)
			throw new Error("Failed to resolve any scripts for tsPath: " + tsPath);

		this.scriptLookupCache[tsPath] = {scripts, timestamp: Date.now()};

		this.saveScriptLookupCache();

		return scripts;
	}

	/**
	 * Resolves a TokenScript file and returns its source URL & XML content
	 * @param tsId The unique identifier for the TokenScript file
	 * @param forceRefresh true = Bypass cache and re-resolve the file
	 * @throws Error when the TokenScript cannot be resolved
	 */
	public async getTokenScript(tsId: string, forceRefresh = false): Promise<ResolvedScriptData> {

		const scripts = await this.resolveAllScripts(tsId);

		const pathParts = tsId.split("-");

		let chosenScript: ScriptInfo;

		if (pathParts.length > 2){
			chosenScript = scripts.find((scriptInfo) => {
				return scriptInfo.scriptId == pathParts[2];
			});
		} else {
			chosenScript = scripts[0];
		}

		if (!chosenScript)
			throw new Error("Could not find a script corresponding to the tsId: " + tsId);

		return await this.fetchTokenScript(chosenScript, forceRefresh);
	}

	private async fetchTokenScript(scriptInfo: ScriptInfo, forceRefresh: boolean){

		let uri = scriptInfo.sourceUrl;

		// TODO: Update smartcat links and remove this
		if (uri === "https://viewer.tokenscript.org/assets/tokenscripts/smart-cat-prod.tsml"){
			console.log("SmartCat tokenscript detected, using updated version for newer features and better performance");
			uri = "/assets/tokenscripts/smart-cat-prod-2024-01.tsml";
		} else if (uri === "https://viewer-staging.tokenscript.org/assets/tokenscripts/smart-cat-mumbai.tsml"){
			console.log("SmartCat tokenscript detected, using updated version for newer features and better performance");
			uri = "/assets/tokenscripts/smart-cat-mumbai-2024-01.tsml";
		} else if (uri === "https://viewer.tokenscript.org/assets/tokenscripts/smart-cat-loot-prod.tsml"){
			// Always use staging version on staging site
			uri = "/assets/tokenscripts/smart-cat-loot-prod.tsml";
		}

		uri = this.context.processIpfsUrl(uri);

		let response = await fetch(uri, {
			cache: forceRefresh ? "no-store" : undefined
		});

		if (response.status < 200 || response.status > 299)
			throw new Error("HTTP Error: " + response.status);

		return {
			...scriptInfo,
			xml: await response.text()
		};
	}

	/**
	 * Save lookup cache
	 */
	public saveScriptLookupCache(){
		if (!this.context.config.noLocalStorage) {
			try {
				localStorage.setItem(Repo.LOCAL_STORAGE_KEY, JSON.stringify(this.scriptLookupCache));
			} catch (e: any){
				console.warn("Failed to store tokenscript definition: ", e.message);
			}
		}
	}
}

import {ScriptSourceType, TokenScriptEngine} from "../Engine";
import {ResolvedScriptData, ScriptInfo, SourceInterfaceConstructor} from "./sources/SourceInterface";
import {ScriptURI} from "./sources/ScriptURI";
import {TokenScriptRepo} from "./sources/TokenScriptRepo";
import {RegistryScriptURI} from "./sources/RegistryScriptURI";

/**
 * Repo.ts is class that is used to resolve TokenScripts from various sources and cache them in localStorage
 */
export class Repo {

	/**
	 * Any number of sources can be defined and their order changed.
	 * The first source should be the most reliable to avoid fallback lookups.
	 */
	static REPO_SOURCES: SourceInterfaceConstructor[] = [
		ScriptURI,
		RegistryScriptURI,
		TokenScriptRepo
	];

	/**
	 * Repo cache TTL in seconds
	 */
	static REPO_TTL = 300;

	private scriptCache: {[chainAndContract: string]: ScriptInfo[]} = {};

	constructor(protected context: TokenScriptEngine) {

	}

	/**
	 * Resolves a list of script entries for this chain & contract.
	 * @param tsPath
	 * @param forceRefresh
	 */
	public async resolveAllScripts(tsPath: string, forceRefresh = false){

		// TODO: Implement persistent cache for script lookups
		if (!forceRefresh && this.scriptCache[tsPath])
			return this.scriptCache[tsPath];

		const scripts = [];

		for (let resolver of Repo.REPO_SOURCES){
			try {
				scripts.push(...await (new resolver(this.context)).resolveAllScripts(tsPath));
			} catch (e) {
				console.log("Failed to resolve tokenscripts using resolver: " + resolver.name, e);
			}
		}

		if (!scripts.length)
			throw new Error("Failed to resolve any scripts for tsPath: " + tsPath);

		this.scriptCache[tsPath] = scripts;

		return scripts;
	}

	/**
	 * Resolves a TokenScript file and returns its source URL & XML content
	 * @param tsId The unique identifier for the TokenScript file
	 * @param forceRefresh true = Bypass cache and re-resolve the file
	 * @throws Error when the TokenScript cannot be resolved
	 */
	public async getTokenScript(tsId: string, forceRefresh = false): Promise<ResolvedScriptData> {

		// TODO: Reimplement cache for script entries.
		/*if (!this.context.config.noLocalStorage)
			try {
				const tsStr = localStorage.getItem("ts-" + tsId);
				tokenScript = JSON.parse(tsStr) as ResolveResult & { timestamp?: number };
			} catch (e){
				// no-op
			}*/
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

		//if (forceRefresh || !tokenScript || !tokenScript.xml ||
			//(Date.now() > tokenScript.timestamp + (Repo.REPO_TTL * 1000))){

			const tokenScript = await this.fetchTokenScript(chosenScript, forceRefresh);
			//tokenScript.timestamp = Date.now();
			//this.saveTokenScript(tsId, tokenScript);
		//}

		return tokenScript;
	}

	private async fetchTokenScript(scriptInfo: ScriptInfo, forceRefresh: boolean){

		console.log("Script info: ", scriptInfo);

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
	 * Remove the TokenScript file from the cache
	 * @param tsId
	 */
	public deleteTokenScript(tsId: string){
		//if (!this.context.config.noLocalStorage)
			//localStorage.removeItem("ts-" + tsId);
	}

	/**
	 * Save a TokenScript file to the cache
	 * @param tsId
	 * @param tokenScript
	 */
	public saveTokenScript(tsId: string, tokenScript: ResolvedScriptData & {timestamp?: number}){
		/*if (!this.context.config.noLocalStorage) {
			localStorage.removeItem("ts-" + tsId);
			try {
				localStorage.setItem("ts-" + tsId, JSON.stringify(tokenScript));
			} catch (e: any){
				console.warn("Failed to store tokenscript definition: ", e.message);
			}
		}*/
	}
}

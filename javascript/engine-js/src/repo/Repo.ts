import {TokenScriptEngine} from "../Engine";
import {ResolveResult, SourceInterfaceConstructor} from "./sources/SourceInterface";
import {ScriptURI} from "./sources/ScriptURI";
import {TokenScriptRepo} from "./sources/TokenScriptRepo";

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
		TokenScriptRepo
	];

	/**
	 * Repo cache TTL in seconds
	 */
	static REPO_TTL = 3600;

	constructor(protected context: TokenScriptEngine) {

	}

	/**
	 * Resolves a TokenScript file and returns its source URL & XML content
	 * @param tsId The unique identifier for the TokenScript file
	 * @param forceRefresh true = Bypass cache and re-resolve the file
	 * @throws Error when the TokenScript cannot be resolved
	 */
	public async getTokenScript(tsId: string, forceRefresh = false): Promise<ResolveResult> {

		let tokenScript;

		if (!this.context.config.noLocalStorage)
			try {
				const tsStr = localStorage.getItem("ts-" + tsId);
				tokenScript = JSON.parse(tsStr) as ResolveResult & { timestamp?: number };
			} catch (e){
				// no-op
			}

		if (forceRefresh || !tokenScript || !tokenScript.xml ||
			(Date.now() > tokenScript.timestamp + (Repo.REPO_TTL * 1000))){

			tokenScript = await this.resolveTokenScript(tsId);
			tokenScript.timestamp = Date.now();
			this.saveTokenScript(tsId, tokenScript);
		}

		return tokenScript;
	}

	/**
	 * Loops through repo sources and returns the first result. If no result is found an error is thrown
	 * @param tsId The unique identifier for the TokenScript file
	 * @private
	 */
	private async resolveTokenScript(tsId: string){

		for (let resolver of Repo.REPO_SOURCES){
			try {
				return await (new resolver(this.context)).getTokenScriptXml(tsId);
			} catch (e){
				console.log("Failed to resolve tokenscript using resolver: " + resolver.name);
			}
		}

		throw new Error("Could not resolve tokenscript with ID: " + tsId);
	}

	/**
	 * Remove the TokenScript file from the cache
	 * @param tsId
	 */
	public deleteTokenScript(tsId: string){
		if (!this.context.config.noLocalStorage)
			localStorage.removeItem("ts-" + tsId);
	}

	/**
	 * Save a TokenScript file to the cache
	 * @param tsId
	 * @param tokenScript
	 */
	public saveTokenScript(tsId: string, tokenScript: ResolveResult & {timestamp?: number}){
		if (!this.context.config.noLocalStorage)
			localStorage.setItem("ts-" + tsId, JSON.stringify(tokenScript));
	}
}

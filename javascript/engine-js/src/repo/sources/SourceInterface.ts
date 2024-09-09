import {TokenScriptEngine, ScriptSourceType} from "../../Engine";

/**
 * Define interfaces for implementing a custom repo source
 */

export interface ResolvedScriptData extends ScriptInfo {
	xml: string;
	//scripts: ScriptInfo[];
}

export interface ScriptInfo {
	name: string;
	icon: string;
	order: number;
	authenticated: boolean,
	sourceId: string, // This is `${chain}-${contract}`
	sourceUrl: string;
	scriptId: number|string; // For scriptUri or TokenScript registry, this is the name defined in the TokenScript otherwise, it is the registry tokenId
	type: ScriptSourceType;
}

export interface SourceInterface {
	/**
	 * Resolves all scripts for a given contract & chain
	 * @param tsPath This is the partial tokenscript ID. It is either a chain-contract or name in the case of the Legacy TokenScript repo
	 */
	resolveAllScripts(tsPath: string): Promise<Omit<ScriptInfo, "timestamp">[]>
}

export interface SourceInterfaceConstructor {
	new(context: TokenScriptEngine): SourceInterface;
}

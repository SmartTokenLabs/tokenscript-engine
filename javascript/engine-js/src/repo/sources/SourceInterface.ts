import {TokenScriptEngine, ScriptSourceType} from "../../Engine";

/**
 * Define interfaces for implementing a custom repo source
 */

export interface ResolveResult {
	sourceUrl: string;
	xml: string;
	type: ScriptSourceType;
	scripts: ScriptSource[];
}

export interface ScriptSource {
	name: string;
	icon: string;
	order: number;
	authenticated: boolean,
	sourceUrl: string;
	tokenId: number;
	type: ScriptSourceType;
}

export interface SourceInterface {
	getTokenScriptXml(tsId: string): Promise<ResolveResult>
}

export interface SourceInterfaceConstructor {
	new(context: TokenScriptEngine): SourceInterface;
}

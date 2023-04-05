import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";

export interface ViewerInterface {
	getTokenScript(): TokenScript
	openTokenScript(tokenScript: TokenScript): void
}

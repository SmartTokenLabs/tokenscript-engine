import {IToken} from "@tokenscript/engine-js/src/tokens/IToken";
import Dexie from "dexie";

interface TSTokenCacheTokens {
	chainId: number,
	collectionId: string,
	ownerAddress: string,
	data: IToken,
	dt: number
}

interface TSTokenCacheMeta {
	chainId: number,
	collectionId: string,
	data: any,
	dt: number
}

export interface TokenScriptsMeta {
	tokenScriptId: string,
	name: string,
	iconUrl?: string,
	url?: string,
	xml?: string,
}

class TSViewerDb extends Dexie {

	tokens!: Dexie.Table<TSTokenCacheTokens, string>;
	tokenMeta!: Dexie.Table<TSTokenCacheMeta, string>;
	myTokenScripts!: Dexie.Table<TokenScriptsMeta, string>;

	constructor() {
		super("TSViewer");

		this.version(2).stores({
			tokens: `[chainId+collectionId+ownerAddress], data, dt`,
			tokenMeta: `[chainId+collectionId], data, dt`,
			myTokenScripts: `[tokenScriptId], name, iconUrl, xml`
		});
	}
}

export const dbProvider = new TSViewerDb();

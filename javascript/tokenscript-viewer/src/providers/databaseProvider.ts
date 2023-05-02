import {IToken} from "@tokenscript/engine-js/src/tokens/IToken";
import Dexie from "dexie";
import {TokenScriptSource} from "../components/app/app";

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
	loadType: TokenScriptSource
	name: string,
	iconUrl?: string,
	xml?: string,
}

class TSViewerDb extends Dexie {

	tokens!: Dexie.Table<TSTokenCacheTokens, string>;
	tokenMeta!: Dexie.Table<TSTokenCacheMeta, string>;
	myTokenScripts!: Dexie.Table<TokenScriptsMeta, string>;

	constructor() {
		super("TSViewer");

		this.version(2).stores({
			tokens: `[chainId+collectionId+ownerAddress], dt`,
			tokenMeta: `[chainId+collectionId], dt`,
			myTokenScripts: `tokenScriptId`
		});
	}
}

export const dbProvider = new TSViewerDb();

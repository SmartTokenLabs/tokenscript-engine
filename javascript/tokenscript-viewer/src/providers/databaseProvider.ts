import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import Dexie from "dexie";
import {TokenScriptSource} from "../components/app/app";
import {IAttestationData} from "@tokenscript/engine-js/src/attestation/IAttestationStorageAdapter";

interface TSTokenCacheTokens {
	chainId: number,
	collectionId: string,
	ownerAddress: string,
	data: ITokenCollection,
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
	attestations!: Dexie.Table<IAttestationData, string>;

	constructor() {
		super("TSViewer");

		this.version(3).stores({
			tokens: `[chainId+collectionId+ownerAddress], dt`,
			tokenMeta: `[chainId+collectionId], dt`,
			myTokenScripts: `tokenScriptId`,
			attestations: `[collectionId+tokenId]`
		});
	}
}

export const dbProvider = new TSViewerDb();

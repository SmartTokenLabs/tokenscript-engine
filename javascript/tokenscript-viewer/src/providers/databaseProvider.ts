import {ITokenCollection, TokenType} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import Dexie from "dexie";
import {TokenScriptSource} from "../components/app/app";
import {IAttestationData} from "@tokenscript/engine-js/src/attestation/IAttestationStorageAdapter";

export interface TSTokenCacheTokens {
	chainId: number,
	collectionId: string,
	tokenType: Omit<TokenType, "eas">,
	ownerAddress: string,
	data: ITokenCollection,
	dt: number
}

export interface TSTokenCacheMeta {
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

export interface TokenScriptLocalStorage {
	tokenScriptId: string,
	key: string,
	value: string,
}

class TSViewerDb extends Dexie {

	tokens2!: Dexie.Table<TSTokenCacheTokens, string>;
	tokenMeta!: Dexie.Table<TSTokenCacheMeta, string>;
	myTokenScripts!: Dexie.Table<TokenScriptsMeta, string>;
	attestations!: Dexie.Table<IAttestationData, string>;
	tsLocalStorage!: Dexie.Table<TokenScriptLocalStorage, string>;

	constructor() {
		super("TSViewer");

		this.version(6).stores({
			tokens2: `&[chainId+collectionId+tokenType+ownerAddress], dt`,
			tokenMeta: `&[chainId+collectionId], dt`,
			myTokenScripts: `&tokenScriptId`,
			attestations: `&[collectionId+tokenId]`,
			tsLocalStorage: `&[tokenScriptId+key], tokenScriptId`
		});
	}

	async checkCompatibility(){
		try {
			await this.open();
		} catch (e){
			console.warn("Dexie database open error, initializing new DB");
			await this.cloneDatabase(this.name, `${this.name}-backup-${Date.now()}`);
			await this.delete();
			await this.open();
		}
	}

	async cloneDatabase(sourceName, destinationName) {
		//
		// Open source database
		//
		const origDb = new Dexie(sourceName);
		return origDb.open().then(()=> {
			// Create the destination database
			const destDb = new Dexie(destinationName);

			//
			// Clone Schema
			//
			const schema = origDb.tables.reduce((result,table)=>{
				result[table.name] = [table.schema.primKey]
					.concat(table.schema.indexes)
					.map(indexSpec => indexSpec.src).join(",");
				return result;
			}, {});
			destDb.version(this.verno).stores(schema);

			//
			// Clone Data
			//
			return origDb.tables.reduce(

				(prev, table) => prev
					.then(() => table.toArray())
					.then(rows => destDb.table(table.name).bulkAdd(rows)),

				Promise.resolve(1)

			).then(()=>{
				//
				// Finally close the databases
				//
				origDb.close();
				destDb.close();
			});
		});
	}
}

export const dbProvider = new TSViewerDb();

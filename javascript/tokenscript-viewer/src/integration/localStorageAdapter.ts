import {ILocalStorageAdapter} from "../../../engine-js/src/view/data/ILocalStorageAdapter";
import {dbProvider} from "../providers/databaseProvider";

export class LocalStorageAdapter implements ILocalStorageAdapter {

	clear(tsId: string): void {
		dbProvider.tsLocalStorage.where({tokenScriptId: tsId}).delete();
	}

	async getAllItems(tsId: string): Promise<{ [p: string]: string }> {
		const results = await dbProvider.tsLocalStorage.where({tokenScriptId: tsId}).toArray();

		const dict = results.reduce<{ [p: string]: string }>((object, entry) => {
			object[entry.key] = entry.value;
			return object;
		}, {});

		console.log(dict);

		return dict;
	}

	removeItem(tsId: string, key: string): void {
		dbProvider.tsLocalStorage.where({tokenScriptId: tsId, key}).delete();
	}

	setItem(tsId: string, key: string, value: string): void {
		dbProvider.tsLocalStorage.put({
			tokenScriptId: tsId,
			key,
			value
		});
	}

}

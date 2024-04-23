import {ITokenScriptSDK} from "../types";
import {RequestFromView} from "../messaging/IEngineAdapter";

export class LocalStorageAdapter implements Storage {

	// TODO: Initialise local storage data from engine - since we are dealing with sync functions this is the only way. When data is updated, it's posted back to the engine asynchronously
	constructor(private sdk: ITokenScriptSDK) {
		try {
			Object.defineProperty(window, 'localStorage', {
				value: this,
				writable: true,
			});
		} catch (e: any){
			console.error(e);
		}
	}

	public get length () {
		return Object.keys(this.sdk.instanceData.localStorageData).length;
	}

	clear(): void {
		this.sdk.instanceData.localStorageData = {};
		this.sdk.engineAdapter.request(RequestFromView.LOCAL_STORAGE, {method: "clear"});
	}

	getItem(key: string): string | null {
		return this.sdk.instanceData.localStorageData[key];
	}

	key(index: number): string | null {
		const keys = Object.keys(this.sdk.instanceData.localStorageData);
		return index < keys.length ? keys[index] : undefined;
	}

	removeItem(key: string): void {
		delete this.sdk.instanceData.localStorageData[key];
		this.sdk.engineAdapter.request(RequestFromView.LOCAL_STORAGE, {method: "remove", key});
	}

	setItem(key: string, value: string): void {
		this.sdk.instanceData.localStorageData[key] = value;
		this.sdk.engineAdapter.request(RequestFromView.LOCAL_STORAGE, {method: "set", key, value});
	}

	[name: string]: any;
}
import {ITokenScriptSDK} from "../types";
import {RequestFromView} from "../messaging/IEngineAdapter";

export class LocalStorageAdapter implements Storage {

	private data: {[key: string]: string} = {};

	// TODO: Initialise local storage data from engine - since we are dealing with sync functions this is the only way. When data is updated, it's posted back to the engine asynchronously
	constructor(private sdk: ITokenScriptSDK) {
		Object.defineProperty(window, 'localStorage', {
			value: this,
			writable: true,
		});
	}

	public get length () {
		return Object.keys(this.data).length;
	}

	clear(): void {
		this.data = {};
		this.sdk.engineAdapter.request(RequestFromView.LOCAL_STORAGE, {method: "clear"});
	}

	getItem(key: string): string | null {
		return this.data[key];
	}

	key(index: number): string | null {
		const keys = Object.keys(this.data);
		return index < keys.length ? keys[index] : undefined;
	}

	removeItem(key: string): void {
		delete this.data[key];
		this.sdk.engineAdapter.request(RequestFromView.LOCAL_STORAGE, {method: "remove", key});
	}

	setItem(key: string, value: string): void {
		this.data[key] = value;
		this.sdk.engineAdapter.request(RequestFromView.LOCAL_STORAGE, {method: "set", key, value});
	}

	[name: string]: any;
}
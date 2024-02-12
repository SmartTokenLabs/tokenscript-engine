import {TokenScript} from "../../TokenScript";

export interface LocalStorageRequest {
	method: "set"|"remove"|"clear";
	key?: string,
	value?: string
}

export class LocalStorageProxy {

	private tsId;

	constructor(private tokenscript: TokenScript) {
		this.tsId = tokenscript.getSourceInfo().tsId;
	}

	public handleLocalStorageRequest(request: LocalStorageRequest){

		if (!this.tokenscript.getEngine().getLocalStorageAdapter){
			console.warn("LocalStorage adapter not provided, no persistence available");
			return;
		}

		const adapter = this.tokenscript.getEngine().getLocalStorageAdapter();

		switch (request.method){
			case "set":
				adapter.setItem(this.tsId, request.key, request.value)
				break;
			case "remove":
				adapter.removeItem(this.tsId, request.key);
				break;
			case "clear":
				adapter.clear(this.tsId);
				break;
		}
	}

	public async getLocalStorageDictionary(){
		if (!this.tokenscript.getEngine().getLocalStorageAdapter){
			console.warn("LocalStorage adapter not provided, no persistence available");
			return {};
		}

		const adapter = this.tokenscript.getEngine().getLocalStorageAdapter();
		return await adapter.getAllItems(this.tsId);
	}
}

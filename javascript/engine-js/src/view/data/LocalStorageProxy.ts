import {TokenScript} from "../../TokenScript";

interface LocalStorageRequest {
	method: "set"|"remove"|"clear";
	key?: string,
	value?: string
}

export class LocalStorageProxy {

	private tsId;

	constructor(private tokenscript: TokenScript) {
		this.tsId = tokenscript.getSourceInfo().tsId;
	}

	public handleLocalStorageRequest(request){

	}

	public getLocalStorageDictionary(){

	}
}

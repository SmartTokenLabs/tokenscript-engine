
export enum ViewEvent {
	TOKENS_UPDATED = "tokensUpdated",
	GET_USER_INPUT = "getUserInput",
	EXECUTE_CALLBACK = "executeCallback",
	ON_CONFIRM = "onConfirm",
	TRANSACTION_EVENT = "transactionEvent"
}

export enum RequestFromView {
	SIGN_PERSONAL_MESSAGE = "signPersonalMessage",
	PUT_USER_INPUT = "putUserInput",
	CLOSE = "close",
	ETH_RPC = "ethRpc"
}

export interface IEngineAdapter {
	//constructor(sdk: ITokenScriptSDK, origin: string): IEngineAdapter;
	request(method: RequestFromView, params: any): void;
}

/*interface IEngineAdapterConstructor {
	new(sdk: ITokenScriptSDK, origin: string): IEngineAdapter;
}*/
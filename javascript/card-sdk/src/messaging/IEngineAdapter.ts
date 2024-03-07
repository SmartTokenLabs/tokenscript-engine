
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
	ETH_RPC = "ethRpc",
	LOCAL_STORAGE = "localStorage",
	// UI methods must be handled by the view adapter, not forwarded to the engine
	SET_LOADER = "setLoader",
	SHOW_TX_TOAST = "showTransactionToast",
	SHOW_TOAST = "showToast"
}

export interface IEngineAdapter {
	// TODO: Overload for each RequestFromView to provide params type
	request(method: RequestFromView, params: any): void;
}

/*interface IEngineAdapterConstructor {
	new(sdk: ITokenScriptSDK, origin: string): IEngineAdapter;
}*/
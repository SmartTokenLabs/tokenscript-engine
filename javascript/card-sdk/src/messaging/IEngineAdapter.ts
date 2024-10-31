
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
	OPEN_CARD = "openCard",
	ETH_RPC = "ethRpc",
	LOCAL_STORAGE = "localStorage",
	// UI methods must be handled by the view adapter, not forwarded to the engine
	SET_LOADER = "setLoader",
	SET_BUTTON = "setButton",
	EXEC_TRANSACTION = "execTransaction",
	REFRESH_TOKENS = "refreshTokens",
	SHOW_TX_TOAST = "showTransactionToast",
	SHOW_TOAST = "showToast",
	TLINK_REQUEST = "tlinkRequest"
}

export interface IEngineAdapter {
	// TODO: Overload for each RequestFromView to provide params type
	request<T>(method: RequestFromView, params: any, listener?: true|IResponseListener<T>): T | Promise<T>;
}

export type IResponseListener<T> = (event: ViewEvent, data: T) => boolean | Promise<boolean>;

export interface IResponseListenerEntry {
	processResponse: IResponseListener<any>,
	resolve: (data: any) => void,
	reject: (error: Error|any) => void
}

/*interface IEngineAdapterConstructor {
	new(sdk: ITokenScriptSDK, origin: string): IEngineAdapter;
}*/
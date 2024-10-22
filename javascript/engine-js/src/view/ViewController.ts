import {ITransactionListener, ITransactionStatus} from "../ITokenScript";
import {TokenScript} from "../TokenScript";
import {Card} from "../tokenScript/Card";
import {RpcRequest, RpcResponse} from "../wallet/IWalletAdapter";
import {LocalStorageProxy, LocalStorageRequest} from "./data/LocalStorageProxy";
import {IViewBinding} from "./IViewBinding";
import {TokenViewData} from "./TokenViewData";

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
	SHOW_TOAST = "showToast"
}

export type TXTrigger = "refreshTokens"|"invalidateAttributes";

export interface TXOptions {
	txName?: string,
	chainId?: number,
	contractAddress?: string,
	triggers?: TXTrigger[]
}

/**
 * The ViewController acts as an intermediary between the user-agent supplied viewAdapter (IViewBinding) & the engine
 * This allows us to have more complex logic in the ViewController in order to keep IViewBinding simple & low-level
 *
 * The view binding also calls method on the ViewController for various functions, such as setting user-input attributes.
 */
export class ViewController {

	private currentCard?: Card;
	private _tokenViewData?: TokenViewData;
	private userEntryValues: {[scopeId: string]: {[key: string]: any}} = {};
	private localStorageProxy: LocalStorageProxy;

	constructor(public readonly tokenScript: TokenScript, private viewAdapter: IViewBinding) {
		this.localStorageProxy = new LocalStorageProxy(this.tokenScript);
	}

	/**
	 * Show a card in the user interface
	 * @param card
	 * @param transactionListener
	 */
	async showOrExecuteCard(card: Card, transactionListener?: ITransactionListener){

		this.currentCard = card;

		if (!card.view){
			// Transaction-only card
			await this.executeTransactionAndProcessTriggers(transactionListener);
			this.currentCard = null;
			return;
		}

		//this.userEntryValues = {};
		this._tokenViewData = new TokenViewData(this.tokenScript, this.currentCard);

		this.viewAdapter.viewLoading();

		await this.viewAdapter.showTokenView(this.currentCard);
	}

	public get tokenViewData () {
		return this._tokenViewData;
	}

	async executeTransaction(transactionListener?: ITransactionListener, options?: {id?: string}&TXOptions){

		const transaction = this.currentCard.getTransaction(options?.txName);

		if (transaction){

			console.log(transaction.getTransactionInfo());

			this.viewAdapter.showLoader();

			try {
				await this.executeTransactionAndProcessTriggers((data: ITransactionStatus) => {
					if (data.status === "completed" || data.status === "aborted")
						this.viewAdapter.showLoader(false);

					this.tokenScript.emitEvent("TX_STATUS", data);
					this.viewAdapter.dispatchViewEvent(ViewEvent.TRANSACTION_EVENT, data, options?.id);
					if (transactionListener)
						transactionListener(data);
				}, options);
			} catch (e){
				this.viewAdapter.showLoader(false);
				this.tokenScript.emitEvent("TX_STATUS", {status: "error", message: e.message, error: e});
				this.viewAdapter.dispatchViewEvent(ViewEvent.TRANSACTION_EVENT, {status: "error", message: e.message, error: e}, options?.id);
				throw e;
			}

		} else {
			this.dispatchViewEvent(ViewEvent.ON_CONFIRM, {}, options?.id);
		}
	}

	private async executeTransactionAndProcessTriggers(listener?: ITransactionListener, txOptions?: TXOptions){

		this.dispatchViewEvent(ViewEvent.GET_USER_INPUT, null, null);

		if (!txOptions)
			txOptions = {};

		if (!txOptions.triggers)
			txOptions.triggers = ["invalidateAttributes", "refreshTokens"];

		const txStatus = await this.currentCard.executeTransaction(listener, txOptions);

		if (txStatus === false)
			return;

		if (txOptions.triggers?.length) {

			let tokens;
			if (txOptions.triggers.indexOf("refreshTokens") > -1) {
				// Pause to let token discovery service update
				await new Promise(resolve => setTimeout(resolve, 3000));

				tokens = await this.tokenScript.getTokenMetadata(true, true);
			}

			const context = this.tokenScript.getCurrentTokenContext();
			const reloadCard = await this.currentCard.isEnabledOrReason(context) === true;

			if (this.tokenScript.hasViewBinding()){
				// The card is reloaded based on the following criteria
				// - The card is still available based on isEnabledOrReason
				// - Tokens have not been reloaded OR the card is an onboarding card OR the token still exists (not burnt or transferred)
				if (reloadCard && (!context || !tokens || tokens[context.originId]?.tokenDetails?.[context.selectedTokenIndex])){
					await this.updateCardData();
				} else {
					await this.unloadTokenCard();
				}
			}
		}

		if (listener) {
			listener({
				...txStatus,
				status: 'completed',
			});
		}
	}

	/**
	 * Unload the card from the UI
	 */
	async unloadTokenCard(){
		this.currentCard = null;
		await this.viewAdapter.unloadTokenView();
	}

	/**
	 * The current card loaded in the UI
	 */
	getCurrentCard(){
		return this.currentCard;
	}

	/**
	 * Gets a specific user-entry value that has been set by the token card Javascript
	 * @param key
	 * @param scopeId
	 */
	getUserEntryValue(key: string, scopeId: string){
		if (this.userEntryValues[scopeId]?.[key] === undefined)
			return undefined;

		return this.userEntryValues[scopeId][key];
	}

	/**
	 * Sets user entry values (usually called from the viewAdapter)
	 * @param userEntryValues
	 */
	async setUserEntryValues(userEntryValues: {[key: string]: any}){

		const changedKeys = [];

		let shouldRefresh = false;

		const scopeId = this.tokenScript.getCurrentTokenContext()?.selectedTokenId ?? "-1";

		if (!this.userEntryValues[scopeId])
			this.userEntryValues[scopeId] = {};

		for (let key in userEntryValues){

			if (this.userEntryValues[scopeId][key] &&
				this.userEntryValues[scopeId][key] === userEntryValues[key]){
				continue;
			}

			if (!this.userEntryValues[scopeId][key] && userEntryValues[key] === "")
				continue;

			const attr = this.findAttribute(key);

			// Attributes that are explicitly defined as user entry SHOULD NEVER refresh the view! This can cause loops and all kinds of crazy behavior.
			// However, in the example of ENS, some views require attributes that depend on a value generated by the view in order to refresh the view.
			// By this example these attributes are not specified at all in the XML, defined only by the Javascript, so we can use this check to determine if view data needs to be refreshed.
			if (!attr && !shouldRefresh)
				shouldRefresh = true;

			console.log("User input '" + key + "' changed (" + this.userEntryValues[scopeId][key] + " -> " + userEntryValues[key] + ")");
			// Invalidate attributes that depend on changed user entry value
			changedKeys.push(key);
			this.userEntryValues[scopeId][key] = userEntryValues[key];
		}

		if (changedKeys.length > 0) {

			this.tokenScript.getAttributes().invalidate(changedKeys);
			if (this.currentCard)
				this.currentCard.getAttributes().invalidate(changedKeys);

			if (shouldRefresh) this.updateCardData();
		}
	}

	/**
	 * Find a specific attribute by name, either from the global scope or the scope of the currently loaded card
	 * @param name
	 * @private
	 */
	private findAttribute(name: string){

		if (this.tokenScript.getAttributes().hasAttribute(name))
			return this.tokenScript.getAttributes().getAttribute(name);

		if (this.currentCard && this.currentCard.getAttributes().hasAttribute(name))
			return this.currentCard.getAttributes().getAttribute(name);

		return null;
	}

	async handleMessageFromView(method: RequestFromView, params: any){

		switch (method) {

			case RequestFromView.ETH_RPC:
				this.rpcProxy(params);
				break;

			case RequestFromView.SIGN_PERSONAL_MESSAGE:
				this.signPersonalMessage(params.id, params.data);
				break;

			case RequestFromView.PUT_USER_INPUT:
				await this.setUserEntryValues(params);
				break;

			case RequestFromView.CLOSE:
				this.unloadTokenCard()
				break;

			case RequestFromView.OPEN_CARD:
				const {name, originId, tokenId} = params as {name: string, originId?: string, tokenId?: string};

				// Switch token context if requested
				if (originId){
					this.tokenScript.setCurrentTokenContext(originId, null, tokenId);
				}

				const card = this.tokenScript.getCards().getCardByName(name);

				if (!card)
					throw new Error(`Cannot open card. A card with name ${name} does not exist`);

				const availableOrReason = await card.isEnabledOrReason();

				if (availableOrReason !== true)
					throw new Error(`Cannot open card. The selected card is not available for the specified origin or token ID. ${typeof availableOrReason == "string" ? availableOrReason : ''}`);

				await this.showOrExecuteCard(card);
				break;

			case RequestFromView.LOCAL_STORAGE:
				this.localStorageProxy.handleLocalStorageRequest(params as LocalStorageRequest);
				break;

			case RequestFromView.EXEC_TRANSACTION:
				await this.executeTransaction(null, params);
				break;

			case RequestFromView.REFRESH_TOKENS:
				if (params.invalidateAttributes !== false) {
					this.currentCard.getAttributes().invalidate();
					this.tokenScript.getAttributes().invalidate();
				}
				await this.tokenScript.getTokenMetadata(true, true);
				await this.updateCardData(params.id);
				break;

			default:
				throw new Error("TokenScript view API method: " + method + " is not implemented.");
		}
	}

	/**
	 * Signs a personal message with the provided data and returns the result to the token view.
	 * @param id
	 * @param data
	 */
	private async signPersonalMessage(id, data){

		try {
			this.viewAdapter.showLoader();
			let res = await this.tokenScript.getEngine().signPersonalMessage(data);

			this.dispatchViewEvent(ViewEvent.EXECUTE_CALLBACK, {error: null, result: res}, id);

		} catch (e){
			console.error(e);
			this.dispatchViewEvent(ViewEvent.EXECUTE_CALLBACK, {error: e.message, result: null}, id);
		}

		this.viewAdapter.showLoader(false);
	}

	/**
	 *
	 * @param request
	 */
	private async rpcProxy(request: RpcRequest){

		try {
			const walletAdapter = await this.tokenScript.getEngine().getWalletAdapter();

			// Check if the contract is specified in the tokenscript
			if (["eth_sendTransaction", "eth_signTransaction"].indexOf(request.method) > -1){
				// If validation callback returns false we abort silently
				if (!await this.tokenScript.transactionValidator.validateContractAddress(await walletAdapter.getChain(), request.params[0].to))
					return;
			}

			let res = await walletAdapter.rpcProxy(request);

			this.dispatchRpcResult({jsonrpc: "2.0", id: request.id, result: res});

		} catch (e){
			const message = e?.reason ?? e?.message;
			this.dispatchRpcResult({jsonrpc: "2.0", id: request.id, error: {message, code: e?.code, data: Object.assign({}, e)}});
		}
	}

	/**
	 * Dispatch an event to the token card Javascript
	 * @param event
	 * @param data
	 * @param id
	 */
	dispatchViewEvent(event: ViewEvent, data: any, id: string){
		return this.viewAdapter.dispatchViewEvent(event, data, id);
	}

	/**
	 * Dispatch an event to the token card Javascript
	 * @param response RpcResponse
	 */
	dispatchRpcResult(response: RpcResponse){
		return this.viewAdapter.dispatchRpcResult(response);
	}

	/**
	 * Reload card attributes & dispatch the TOKENS_UPDATED event to the card Javascript
	 */
	async updateCardData(id?: string){
		//this.viewAdapter.viewLoading();
		if (!this.tokenViewData)
			return;

		this.viewAdapter.dispatchViewEvent(ViewEvent.TOKENS_UPDATED, await this.tokenViewData.getCurrentTokenData(true), id ?? this.tokenViewData.getViewDataId());
	}
}

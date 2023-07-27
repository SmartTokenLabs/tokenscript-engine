import {Card} from "../tokenScript/Card";
import {IViewBinding} from "./IViewBinding";
import {ITransactionListener, TokenScript} from "../TokenScript";

export enum ViewEvent {
	TOKENS_UPDATED = "tokensUpdated",
	GET_USER_INPUT = "getUserInput",
	EXECUTE_CALLBACK = "executeCallback",
	ON_CONFIRM = "onConfirm",
}

export enum RequestFromView {
	SIGN_PERSONAL_MESSAGE = "signPersonalMessage",
	PUT_USER_INPUT = "putUserInput",
	CLOSE = "close"
}

/**
 * The ViewController acts as an intermediary between the user-agent supplied viewAdapter (IViewBinding) & the engine
 * This allows us to have more complex logic in the ViewController in order to keep IViewBinding simple & low-level
 *
 * The view binding also calls method on the ViewController for various functions, such as setting user-input attributes.
 */
export class ViewController {

	private currentCard?: Card;
	private userEntryValues: {[key: string]: any} = {};

	constructor(private tokenScript: TokenScript, private viewAdapter: IViewBinding) {

	}

	/**
	 * Show a card in the user interface
	 * @param card
	 * @param transactionListener
	 */
	async showOrExecuteCard(card: Card, transactionListener?: ITransactionListener){

		if (!card.view){
			// Transaction-only card
			return card.executeTransaction(transactionListener);
		}

		//this.userEntryValues = {};
		this.currentCard = card;

		this.viewAdapter.viewLoading();

		await this.viewAdapter.showTokenView(this.currentCard);
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
	 */
	getUserEntryValue(key: string){
		if (!this.userEntryValues[key])
			return undefined;

		return this.userEntryValues[key];
	}

	/**
	 * Sets user entry values (usually called from the viewAdapter)
	 * @param userEntryValues
	 */
	async setUserEntryValues(userEntryValues: {[key: string]: any}){

		const changedKeys = [];

		let shouldRefresh = false;

		for (let key in userEntryValues){

			if (this.userEntryValues[key] &&
				this.userEntryValues[key] === userEntryValues[key]){
				continue;
			}

			if (!this.userEntryValues[key] && userEntryValues[key] === "")
				continue;

			const attr = this.findAttribute(key);

			// Attributes that are explicitly defined as user entry SHOULD NEVER refresh the view! This can cause loops and all kinds of crazy behavior.
			// However, in the example of ENS, some views require attributes that depend on a value generated by the view in order to refresh the view.
			// By this example these attributes are not specified at all in the XML, defined only by the Javascript, so we can use this check to determine if view data needs to be refreshed.
			if (!attr && !shouldRefresh)
				shouldRefresh = true;

			console.log("User input '" + key + "' changed (" + this.userEntryValues[key] + " -> " + userEntryValues[key] + ")");
			// Invalidate attributes that depend on changed user entry value
			changedKeys.push(key);
			this.userEntryValues[key] = userEntryValues[key];
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
	 * Reload card attributes & dispatch the TOKENS_UPDATED event to the card Javascript
	 */
	async updateCardData(){
		this.viewAdapter.viewLoading();

		this.viewAdapter.dispatchViewEvent(ViewEvent.TOKENS_UPDATED, await this.currentCard.tokenViewData.getCurrentTokenData(true), this.currentCard.tokenViewData.getViewDataId());
	}
}

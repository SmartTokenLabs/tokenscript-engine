import {ITokenIdContext, ITransactionListener, TokenScript} from "../TokenScript";
import {TokenViewData} from "../view/TokenViewData";
import {Transaction} from "./Transaction";
import {Attributes} from "./Attributes";
import {ViewEvent} from "../view/ViewController";
import {Label} from "./Label";

export class Card {

	private _label?: Label;
	private transaction?: Transaction;
	private attributes?: Attributes;
	//private selections?: Selections;

	public tokenViewData = new TokenViewData(this.tokenScript, this);

	constructor(
		private tokenScript: TokenScript,
		private cardDef: Element
	) {
	}

	/**
	 * The label of the card
	 */
	get label(){
		if (!this._label)
			this._label = new Label(this.cardDef);

		return this._label.getValue() ?? "Unnamed Card";
	}

	/**
	 * Name of the card
	 */
	get name(){
		return this.cardDef.getAttribute("name");
	}

	/**
	 * The type of card. This can be token, action or activity
	 */
	get type(){
		return this.cardDef.getAttribute("type");
	}

	/**
	 * References a ts:selection element. Tokens matching the selection criteria will be excluded from being able to use this card.
	 */
	get exclude(){
		return this.cardDef.getAttribute("exclude");
	}

	/**
	 * References the token origins that the card is available for as a space-separated list
	 */
	get origins(){
		const origins = this.cardDef.getAttribute("origins");
		if (!origins)
			return []; // Attribute not specified = card available for all origins in the TokenScript

		return origins.split(" ");
	}

	/**
	 * The HTML web content associated with the card
	 */
	get view(): Element {
		return this.cardDef.getElementsByTagName("ts:view")[0];
	}

	/**
	 * The URL fragment (document.location.hash) that is applied to the view when the code is loaded.
	 * This allows single page apps defined in viewContent to use hash routing to load the correct page
	 */
	get urlFragment() {
		return this.view.getAttribute("urlFragment")
	}

	/**
	 * Determines whether the view is to be loaded from a URL or from embedded content in ts:view
	 */
	get isUrlView(){
		return this.url;
	}

	/**
	 * Gets the URL to load remote view content
	 */
	get url(){
		return this.view.getAttribute("url");
	}

	/**
	 * Returns the full view content to be loaded into the webview or iframe.
	 * This function prepends in-built engine scripts, as well as parsing and processing
	 * the view content to inject common viewContent data and ensure correct formatting.
	 */
	public async renderViewHtml(){

		let body = "";

		body += '<div id="' + this.tokenViewData.getViewDataId() + '" class="token-card"></div>' +
				'<script type="text/javascript">' + await this.tokenViewData.getTokenJavascript() + '</script>';

		const viewChildren = this.view.children;

		for (let x=0; x<viewChildren.length; x++){

			const part = viewChildren[x];

			if (part.nodeName == "#text")
				continue;

			if (part.nodeName === "ts:viewContent"){

				const name = part.getAttribute("name");

				const commonElems = this.tokenScript.getViewContent(name);

				if (!commonElems){
					console.error("Could not find viewContent element with " + name);
					continue;
				}

				for (let i=0; i<commonElems.length; i++) {
					body = this.processTags(commonElems[i], body);
				}

				continue;
			}

			body = this.processTags(part, body);
		}

		return `
			<!DOCTYPE html>
				<html lang="en">
				<head>
					<title>TokenScript</title>
					<meta http-equiv="content-type" content="text/html; charset=utf-8" />
				</head>
				<body>
					${body}
				</body>
			</html>
		`;
	}

	/**
	 * Process tags to ensure the correct HTML formatting for styles & scripts, reverting entity escaping where necessary.
	 * @param part
	 * @param body
	 * @private
	 */
	private processTags(part: Element, body: string){

		if (part.localName == "script"){

			let scriptContent;

			if (part.innerHTML.indexOf("<![CDATA[") === -1) {
				// If the view content is not within a CData tag, then we need to decode HTML entities.
				const textElem = document.createElement("textarea");
				textElem.innerHTML = part.innerHTML;
				scriptContent = textElem.value;
			} else {
				scriptContent = part.innerHTML;
			}

			body += '<script ' + (part.getAttribute("type") === "module" ? 'type="module" crossorigin=""' : 'text/javascript') + '>' + scriptContent + '</script>';

		} else if (part.localName === "style") {
			body += '<style>' + part.innerHTML + '</style>';
		} else {
			if (part.outerHTML)
				body += part.outerHTML;
		}

		return body;
	}

	/**
	 * Gets the "local" attributes for this card
	 */
	public getAttributes(){

		if (!this.attributes){
			this.attributes = new Attributes(this.tokenScript, this.cardDef, true);
		}

		return this.attributes;
	}

	// TODO: Inner card selections are not used in any TokenScript example, do they need to be supported?
	//		 If not then the schema needs to be updated to prohibit it
	/*public getSelections(){

		if (!this.selections){
			this.selections = new Selections(this.tokenScript, this.cardDef);
		}

		return this.selections;
	}*/

	/**
	 * Returns true if the action is allowed, or a reason string if disabled.
	 * The reason string is the label of the ts:selection element in the TokenScript file
	 * @param tokenContext The token context for which to determine card availability
	 */
	public async isEnabledOrReason(tokenContext: ITokenIdContext) {

		if (!this.isAvailableForOrigin(tokenContext.originId))
			return false;

		if (!this.exclude)
			return true;

		const selection = this.tokenScript.getSelections().getSelection(this.exclude);

		if (await selection.isInSelection(tokenContext)){
			return selection.getLabel();
		}

		return true;
	}

	/**
	 * Is available for origin
	 */
	public isAvailableForOrigin(originId: string){
		return (this.origins.length === 0 || this.origins.indexOf(originId) > -1)
	}

	/**
	 * Get the transaction record associated with this card
	 */
	getTransaction(){

		if (!this.transaction){
			const transactionsXml = this.cardDef.getElementsByTagName("ts:transaction");

			if (transactionsXml.length > 0)
				this.transaction = new Transaction(this.tokenScript, transactionsXml[0], this.getAttributes());
		}

		return this.transaction;
	}

	/**
	 * Execute the transaction for the card
	 * @param listener
	 * @param waitForConfirmation
	 * @param updateViewData
	 */
	async executeTransaction(listener?: ITransactionListener, waitForConfirmation = true, updateViewData = true){

		const transaction = this.getTransaction();

		await this.tokenScript.executeTransaction(transaction, listener, waitForConfirmation);

		// TODO: transactions should specify which attributes should be invalidated
		this.getAttributes().invalidate();
		this.tokenScript.getAttributes().invalidate();

		if (updateViewData && this.tokenScript.hasViewBinding())
			await this.tokenScript.getViewController().updateCardData();
	}

	/**
	 * Signs a personal message with the provided data and returns the result to the token view.
	 * @param id
	 * @param data
	 */
	async signPersonalMessage(id, data){

		try {
			let res = await this.tokenScript.getEngine().signPersonalMessage(data);

			//this.iframe.contentWindow.executeCallback(id, null, res);
			if (this.tokenScript.hasViewBinding())
				this.tokenScript.getViewController()
					.dispatchViewEvent(ViewEvent.EXECUTE_CALLBACK, {error: null, result: res}, id);

		} catch (e){
			//this.iframe.contentWindow.executeCallback(id, e.message, null);
			if (this.tokenScript.hasViewBinding())
				this.tokenScript.getViewController()
					.dispatchViewEvent(ViewEvent.EXECUTE_CALLBACK, {error: e.message, result: null}, id);
		}
	}
}

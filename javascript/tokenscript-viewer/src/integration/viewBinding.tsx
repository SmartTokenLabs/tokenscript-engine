import {IViewBinding} from "../../../engine-js/src/view/IViewBinding";
import {Card} from "../../../engine-js/src/tokenScript/Card";
import {Attribute} from "../../../engine-js/src/tokenScript/Attribute";
import {TokenScript} from "../../../engine-js/src/TokenScript";
import {RequestFromView, ViewEvent} from "@tokenscript/engine-js/src/view/ViewController";
import {JSX, h} from "@stencil/core";

// TODO: Merge with viewer-tab.tsx
export class ViewBinding implements IViewBinding {

	currentCard?: Card;

	iframe: HTMLIFrameElement
	actionBar: HTMLDivElement;
	actionBtn: HTMLButtonElement;
	loader: HTMLDivElement;

	private tokenScript: TokenScript

	constructor(private view: HTMLElement,
				private showToast?: (type: 'success'|'info'|'warning'|'error', title: string, description:string|JSX.Element) => void) {

		this.iframe = view.querySelector(".tokenscript-frame") as HTMLIFrameElement;
		this.loader = view.querySelector(".view-loader") as HTMLDivElement;
		this.actionBar = view.querySelector(".action-bar") as HTMLDivElement;
		this.actionBtn = view.querySelector(".action-btn") as HTMLButtonElement;
		this.actionBtn.addEventListener('click', this.confirmAction.bind(this));

		window.addEventListener("message", this.handlePostMessageFromView.bind(this));
	}

	setTokenScript(tokenScript: TokenScript){
		this.tokenScript = tokenScript;
	}

	viewLoading(){
		this.showLoader();
	}

	viewError(error: Error): void {
		// TODO: show error in view
		this.hideLoader();
	}

	async showTokenView(card: Card){

		this.currentCard = card;

		(this.view.querySelector(".view-container") as HTMLDivElement).style.display = "block";

		await this.injectContentView(card);

		this.setupConfirmButton(card);

		this.renderAttributesTable();

		this.hideLoader();
	}

	async unloadTokenView(){
		this.currentCard = null;

		(this.view.querySelector(".view-container") as HTMLDivElement).style.display = "none";
		this.iframe.src = "";
		this.actionBar.style.display = "none";
		this.view.querySelector(".attribute-table").innerHTML = "";
	}

	async renderAttributesTable(){
		let attrTable = "<tr><th>Attribute</th><th>Value</th></tr>";

		const rowRender = async (attr: Attribute, isLocal = false) => {
			return `<tr><td>${attr.getName()} ${isLocal? "(Card)" : "(Global)"}</td><td>${await attr.getCurrentValue()}</td></tr>`;
		}

		for (let attr of this.tokenScript.getAttributes()){
			attrTable += await rowRender(attr);
		}

		for (let attr of this.currentCard.getAttributes()){
			attrTable += await rowRender(attr, true);
		}

		this.view.querySelector(".attribute-table").innerHTML = attrTable;
	}

	private showLoader(){
		this.loader.style.display = "flex";
	}

	private hideLoader(){
		this.loader.style.display = "none";
	}

	private async injectContentView(card: Card){

		if (!card.view) {
			this.iframe.src = "";
			return;
		}

		if (card.isUrlView){

			this.iframe.src = card.url;

		} else {
			const html = await card.renderViewHtml();

			const blob = new Blob( [html], { type: "text/html" } );

			const urlFragment = card.urlFragment;

			this.iframe.src = URL.createObjectURL(blob) + (urlFragment ? "#"+urlFragment : "");

			// TODO: try src-doc method
		}

	}

	private setupConfirmButton(card: Card){

		if (card.type == "action"){
			this.actionBar.style.display = "block";
			this.actionBtn.innerText = card.label;
		} else {
			this.actionBar.style.display = "none";
		}
	}

	// TODO: move this logic into engine
	async confirmAction(){

		const transaction = this.currentCard.getTransaction();

		this.showLoader();

		if (transaction){

			console.log(transaction.getTransactionInfo());

			try {
				await this.currentCard.executeTransaction((data) => {
					switch (data.status){
						case "submitted":
							this.showToast(
								'info',
								"Transaction submitted",
								(<span>
									{"Processing TX, please wait.. "}<br/>
									{"TX Number: " + data.txNumber }
								</span>)
							);
							break;
						case "confirmed":
							this.showToast(
								'success',
								"Transaction confirmed",
								(<span>
									{"TX " + data.txNumber + " confirmed!"}<br/>{
									data.txLink ? <a href={data.txLink} target="_blank">{"View On Block Scanner"}</a> : ''}
								</span>)
							);
							break;
					}
				});
			} catch (e){
				console.error(e);
				this.showToast('error', "Transaction Error", e.message);
			}

		} else {
			// this.iframe.contentWindow.onConfirm();
			this.postMessageToView(ViewEvent.ON_CONFIRM, {});
		}

		this.hideLoader();
	}

	getViewBindingJavascript(){
		return `
			window.addEventListener("message", (event) => {

				if (event.origin !== "${document.location.origin}")
					return;

				const params = event.data?.params;

				switch (event.data?.method){
					case "tokensUpdated":
						window.web3.tokens.dataChanged(params.oldTokens, params.updatedTokens, params.cardId);
						break;

					case "onConfirm":
						window.onConfirm();
						break;

					case "executeCallback":
						window.executeCallback(params.id, params.error, params.result);
						break;

					case "getUserInput":
						sendUserInputValues();
				}
			});

			function sendUserInputValues(){

				const inputs = Array.from(document.querySelectorAll("textarea,input")).filter((elem) => !!elem.id);

				const values = Object.fromEntries(inputs.map((elem) => {
					return [elem.id, elem.value];
				}));

				postMessageToEngine("putUserInput", values);
			}

			function postMessageToEngine(method, params){
				window.parent.postMessage({method, params}, {
					targetOrigin: "${document.location.origin}"
				});
			}

			window.alpha = {
				signPersonalMessage: (id, data) => {
					postMessageToEngine("signPersonalMessage", {id, data});
				}
			};

			window.web3.action.setProps = (params) => {
				postMessageToEngine("putUserInput", params);
			};

			function listenForUserValueChanges(){
				window.addEventListener('change', (evt) => {
                    if (!evt.target.id) return;
					sendUserInputValues();
                });
			}

			listenForUserValueChanges();
			/*document.addEventListener("DOMContentLoaded", function() {
				sendUserInputValues();
			});*/
		`;
	}

	private postMessageToView(method: ViewEvent, params: any){
		this.iframe.contentWindow.postMessage({method, params}, "*");
	}

	private handlePostMessageFromView(event: MessageEvent){

		if (!this.iframe.src)
			return;

		if (event.source !== this.iframe.contentWindow) {
			return; // Skip message in this event listener
		}

		//const iframeOrig = new URL(this.iframe.src).origin;
		//if (event.origin !== iframeOrig)
		//return;

		if (!event.data?.method)
			return;

		//console.log("Event from view: ", event.data);

		this.handleMessageFromView(event.data.method, event.data?.params);
	}

	async handleMessageFromView(method: RequestFromView, params: any){

		switch (method){

			case RequestFromView.SIGN_PERSONAL_MESSAGE:
				console.log("Event from view: Sign personal message");
				this.currentCard.signPersonalMessage(params.id, params.data);
				break;

			case RequestFromView.PUT_USER_INPUT:
				await this.tokenScript.getViewController().setUserEntryValues(params);
				this.renderAttributesTable();
				break;

			default:
				throw new Error("TokenScript view API method: " + method + " is not implemented.");
		}
	}

	async dispatchViewEvent(event: ViewEvent, data: any, id: string) {

		switch (event){

			case ViewEvent.TOKENS_UPDATED:
				const tokens = {
					currentInstance: data
				}

				console.log("ViewEvent.TOKENS_UPDATED");

				//this.iframe.contentWindow.web3.tokens.dataChanged(tokens, tokens, cardId);
				this.postMessageToView(event, {oldTokens: tokens, updatedTokens: tokens, cardId: id});

				await this.renderAttributesTable();
				this.hideLoader();
				return;

			case ViewEvent.EXECUTE_CALLBACK:
			case ViewEvent.GET_USER_INPUT:
			case ViewEvent.ON_CONFIRM:
				this.postMessageToView(event, {...data, id});
				return;
		}
	}
}

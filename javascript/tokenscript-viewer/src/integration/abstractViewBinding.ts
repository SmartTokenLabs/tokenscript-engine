import {IViewBinding} from "../../../engine-js/src/view/IViewBinding";
import {Card} from "../../../engine-js/src/tokenScript/Card";
import {TokenScript} from "../../../engine-js/src/TokenScript";
import {RequestFromView, ViewEvent} from "@tokenscript/engine-js/src/view/ViewController";

export abstract class AbstractViewBinding implements IViewBinding {

	currentCard?: Card;

	iframe: HTMLIFrameElement
	actionBar: HTMLDivElement;
	actionBtn: HTMLButtonElement;
	loader: HTMLDivElement;

	protected tokenScript: TokenScript

	constructor(protected view: HTMLElement) {

		this.iframe = view.querySelector(".tokenscript-frame") as HTMLIFrameElement;
		this.loader = view.querySelector(".view-loader") as HTMLDivElement;
		this.actionBar = view.querySelector(".action-bar") as HTMLDivElement;
		this.actionBtn = view.querySelector(".action-btn") as HTMLButtonElement;
		this.actionBtn.addEventListener('click', this.confirmAction.bind(this));

		window.addEventListener("message", this.handlePostMessageFromView.bind(this));
	}

	setTokenScript(tokenScript: TokenScript) {
		this.tokenScript = tokenScript;
	}

	viewLoading() {
		this.showLoader();
	}

	viewError(error: Error): void {
		// TODO: show error in view
		this.hideLoader();
	}

	async showTokenView(card: Card) {

		this.currentCard = card;

		await this.injectContentView(card);

		this.setupConfirmButton(card);

		this.hideLoader();
	}

	async unloadTokenView() {
		this.currentCard = null;
		this.iframe.src = "";
		this.actionBar.style.display = "none";
	}

	protected showLoader() {
		this.loader.style.display = "flex";
	}

	protected hideLoader() {
		this.loader.style.display = "none";
	}

	private async injectContentView(card: Card) {

		if (!card.view) {
			this.iframe.src = "";
			return;
		}

		if (card.isUrlView) {

			this.iframe.src = card.url;

		} else {
			const html = await card.renderViewHtml();

			const blob = new Blob([html], {type: "text/html"});

			const urlFragment = card.urlFragment;

			this.iframe.src = URL.createObjectURL(blob) + (urlFragment ? "#" + urlFragment : "");

			// TODO: try src-doc method
		}

	}

	private setupConfirmButton(card: Card) {

		if (card.type == "action") {
			this.actionBar.style.display = "block";
			this.actionBtn.innerText = card.label;
		} else {
			this.actionBar.style.display = "none";
		}
	}

	abstract confirmAction();

	getViewBindingJavascript() {
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

	protected postMessageToView(method: ViewEvent, params: any) {
		this.iframe.contentWindow.postMessage({method, params}, "*");
	}

	protected handlePostMessageFromView(event: MessageEvent) {

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

	async handleMessageFromView(method: RequestFromView, params: any) {

		switch (method) {

			case RequestFromView.SIGN_PERSONAL_MESSAGE:
				console.log("Event from view: Sign personal message");
				this.currentCard.signPersonalMessage(params.id, params.data);
				break;

			case RequestFromView.PUT_USER_INPUT:
				await this.tokenScript.getViewController().setUserEntryValues(params);
				break;

			default:
				throw new Error("TokenScript view API method: " + method + " is not implemented.");
		}
	}

	async dispatchViewEvent(event: ViewEvent, data: any, id: string) {

		switch (event) {

			case ViewEvent.TOKENS_UPDATED:
				const tokens = {
					currentInstance: data
				}

				console.log("ViewEvent.TOKENS_UPDATED");

				//this.iframe.contentWindow.web3.tokens.dataChanged(tokens, tokens, cardId);
				this.postMessageToView(event, {oldTokens: tokens, updatedTokens: tokens, cardId: id});

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

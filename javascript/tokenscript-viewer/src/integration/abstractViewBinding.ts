import {IViewBinding} from "../../../engine-js/src/view/IViewBinding";
import {Card} from "../../../engine-js/src/tokenScript/Card";
import {TokenScript} from "../../../engine-js/src/TokenScript";
import {RequestFromView, ViewController, ViewEvent} from "@tokenscript/engine-js/src/view/ViewController";
import {RpcResponse} from "../../../engine-js/src/wallet/IWalletAdapter";

export abstract class AbstractViewBinding implements IViewBinding {

	currentCard?: Card;

	iframe: HTMLIFrameElement
	actionBar: HTMLDivElement;
	actionBtn: HTMLButtonElement;
	loader: HTMLDivElement;

	protected tokenScript: TokenScript
	protected _viewController: ViewController;

	constructor(protected view: HTMLElement) {

		this.iframe = view.querySelector(".tokenscript-frame") as HTMLIFrameElement;
		this.loader = view.querySelector(".view-loader") as HTMLDivElement;
		this.actionBar = view.querySelector(".action-bar") as HTMLDivElement;
		this.actionBtn = view.querySelector(".action-btn") as HTMLButtonElement;
		if (this.actionBtn)
			this.actionBtn.addEventListener('click', this.confirmAction.bind(this));

		window.addEventListener("message", this.handlePostMessageFromView.bind(this));
	}

	// TODO: This can probably be accessed via view controller
	setTokenScript(tokenScript: TokenScript) {
		this.tokenScript = tokenScript;
	}

	setViewController(viewController: ViewController){
		this._viewController = viewController;
		this.setTokenScript(viewController.tokenScript);
	}

	get viewController() {
		if (!this._viewController)
			return this.tokenScript.getViewController();

		return this._viewController;
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

		this.iframe = await AbstractViewBinding.injectContentView(this.iframe, card, this.viewController);
		this.iframe.onload = () => {
			this.hideLoader()
		}

		this.setupConfirmButton(card);
	}

	async unloadTokenView() {
		this.currentCard = null;
		this.actionBar.style.display = "none";
		this.iframe.srcdoc = "<!DOCTYPE html>";
		//this.iframe.contentWindow.location.replace("data:text/html;base64,PCFET0NUWVBFIGh0bWw+");
	}

	public showLoader(show = true) {
		if (show){
			this.loader.style.display = "flex";
		} else {
			this.hideLoader();
		}
	}

	protected hideLoader() {
		this.loader.style.display = "none";
		// Return focus to iframe
		if (this.iframe)
			this.iframe.contentWindow.focus();
	}

	static async injectContentView(iframe: HTMLIFrameElement, card: Card, viewController: ViewController) {

		if (!card.view) {
			iframe.src = "";
			return;
		}

		if (card.isUrlView) {

			iframe.src = card.url;

		} else {

			const html = await viewController.tokenViewData.renderViewHtml();

			if (new URLSearchParams(document.location.search).has("___b64url")){
				const blob = new Blob([html], {type: "text/html"});
				iframe.src = URL.createObjectURL(blob) + ("#" + viewController.tokenViewData.getCardUrlParameters());
			} else {
				iframe.srcdoc = html;
			}
		}

		return iframe;
	}

	private setupConfirmButton(card: Card) {

		if ((this.currentCard?.type == "action" || this.currentCard?.type == "onboarding") && this.currentCard.uiButton) {
			this.actionBar.style.display = "block";
			this.actionBtn.innerText = card.label;
		} else {
			this.actionBar.style.display = "none";
		}
	}

	abstract confirmAction();

	getViewBindingJavascript() {
		return VIEW_BINDING_JAVASCRIPT;
	}

	protected postMessageToView(method: ViewEvent, params: any) {
		this.iframe.contentWindow.postMessage({method, params}, "*");
	}

	dispatchRpcResult(response: RpcResponse): Promise<void> | void {
		return this.iframe.contentWindow.postMessage(response, "*");
	}

	protected async handlePostMessageFromView(event: MessageEvent) {

		if (!this.iframe)
			return;

		if (event.source !== this.iframe.contentWindow) {
			return; // Skip message in this event listener
		}

		//const iframeOrig = new URL(this.iframe.src).origin;
		//if (event.origin !== iframeOrig)
		//return;

		if (!event.data?.method)
			return;

		console.log("Event from view: ", event.data);

		await this.handleMessageFromView(event.data.method, event.data?.params);
	}

	async handleMessageFromView(method: RequestFromView, params: any) {

		// Use main controller to store user-entry values
		// TODO: Move user entry value logic out of view controller to avoid this issue
		if (method === RequestFromView.PUT_USER_INPUT){
			await this.tokenScript.getViewController().handleMessageFromView(method, params);
			return;
		}

		await this.viewController.handleMessageFromView(method, params);
	}

	async dispatchViewEvent(event: ViewEvent, data: any, id: string) {

		switch (event) {

			case ViewEvent.TOKENS_UPDATED:
				const tokens = {
					currentInstance: data
				}

				console.log("ViewEvent.TOKENS_UPDATED");

				this.postMessageToView(event, {oldTokens: tokens, updatedTokens: tokens, cardId: id, id});

				return;

			default:
				this.postMessageToView(event, {...data, id});
				return;
		}
	}
}

// Note: This formerly had post message logic for the card to interact with the engine
// It has since been moved into the card SDK: javascript/card-sdk/src/messaging/PostMessageAdapter.ts
export const VIEW_BINDING_JAVASCRIPT = `

`;

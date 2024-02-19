import {Component, Event, EventEmitter, h, Prop, State, Watch} from "@stencil/core";
import {ShowToastEventArgs} from "../../app/app";
import {ITransactionStatus, TokenScript} from "../../../../../engine-js/src/TokenScript";
import {IViewBinding} from "../../../../../engine-js/src/view/IViewBinding";
import {RequestFromView, ViewEvent} from "../../../../../engine-js/src/view/ViewController";
import {Card} from "../../../../../engine-js/src/tokenScript/Card";
import {AbstractViewBinding, VIEW_BINDING_JAVASCRIPT} from "../../../integration/abstractViewBinding";
import {handleTransactionError, showTransactionNotification} from "../../viewers/util/showTransactionNotification";
import {RpcResponse} from "../../../../../engine-js/src/wallet/IWalletAdapter";


@Component({
	tag: 'card-popover',
	styleUrl: 'card-popover.css',
	shadow: false,
	scoped: false
})
export class CardPopover implements IViewBinding {

	private dialog: HTMLPopoverDialogElement;
	private iframe: HTMLIFrameElement;

	@Prop()
	tokenScript: TokenScript;

	@State()
	loading: boolean = false;

	@State()
	currentCard?: Card;

	@Event({
		eventName: 'showToast',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) showToast: EventEmitter<ShowToastEventArgs>;

	@Watch('tokenScript')
	async loadTs(){
		this.tokenScript.setViewBinding(this);
	}

	componentDidLoad() {
		if (this.tokenScript)
			this.loadTs();

		window.addEventListener("message", this.handlePostMessageFromView.bind(this));

		this.iframe.onload = () => {
			this.hideLoader()
		}
	}

	hideLoader(){
		setTimeout(() => this.loading = false, 200);
	}

	getViewBindingJavascript(): string {
		return VIEW_BINDING_JAVASCRIPT;
	}

	protected handlePostMessageFromView(event: MessageEvent) {

		if (!this.iframe)
			return;

		if (event.source !== this.iframe.contentWindow) {
			return; // Skip message in this event listener
		}

		if (!event.data?.method)
			return;

		this.handleMessageFromView(event.data.method, event.data?.params);
	}

	async handleMessageFromView(method: RequestFromView, params: any) {
		await this.tokenScript.getViewController().handleMessageFromView(method, params);
	}

	async dispatchViewEvent(event: ViewEvent, data: any, id: string) {

		switch (event) {

			case ViewEvent.TOKENS_UPDATED:
				const tokens = {
					currentInstance: data
				}

				console.log("ViewEvent.TOKENS_UPDATED");

				this.postMessageToView(event, {oldTokens: tokens, updatedTokens: tokens, cardId: id});

				this.hideLoader();
				return;

			case ViewEvent.EXECUTE_CALLBACK:
			case ViewEvent.GET_USER_INPUT:
			case ViewEvent.ON_CONFIRM:
			case ViewEvent.TRANSACTION_EVENT:
				this.postMessageToView(event, {...data, id});
				return;
		}
	}

	protected postMessageToView(method: ViewEvent, params: any) {
		this.iframe.contentWindow.postMessage({method, params}, "*");
	}

	dispatchRpcResult(response: RpcResponse): Promise<void> | void {
		return this.iframe.contentWindow.postMessage(response, "*");
	}

	async showTokenView(card: Card, tsId?: string) {

		this.loading = true;
		await this.dialog.openDialog(() => this.unloadTokenView());
		this.currentCard = card;

		await AbstractViewBinding.injectContentView(this.iframe, card, this.tokenScript.getViewController());
	}

	async unloadTokenView() {
		await this.dialog.closeDialog();
		this.currentCard = null;
		this.iframe.srcdoc = "<!DOCTYPE html>";
		//this.iframe.contentWindow.location.replace("data:text/html;base64,PCFET0NUWVBFIGh0bWw+");
		const newUrl = new URL(document.location.href);
		newUrl.hash = "";
		history.replaceState(undefined, undefined, newUrl);
	}

	viewError(error: Error) {
		this.loading = false;
	}

	viewLoading() {
		this.loading = true;
	}

	async confirmAction(){

		this.loading = true;

		try {
			await this.tokenScript.getViewController().executeTransaction(this.currentCard,(data: ITransactionStatus) => {
				showTransactionNotification(data, this.showToast);
			});
		} catch (e){
			handleTransactionError(e, this.showToast);
		}

		this.loading = false
	}

	render(){
		return (
			<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement}>
				<div slot="outer-content" class="view-loader" style={{display: this.loading ? "flex" : "none"}}>
					<loading-spinner/>
				</div>
				<div class="card-container view-container">
					<div class="iframe-wrapper">
						<iframe ref={(el) => this.iframe = el as HTMLIFrameElement}
								class="tokenscript-frame"
								sandbox="allow-scripts allow-modals allow-forms allow-popups allow-popups-to-escape-sandbox">
						</iframe>
					</div>
					<div class="action-bar" style={{display: this.currentCard?.type == "action" && this.currentCard?.uiButton ? "block" : "none"}}>
						<button class="action-btn btn btn-primary" onClick={() => this.confirmAction()}>{this.currentCard?.label}</button>
					</div>
				</div>
			</popover-dialog>
		)
	}
}

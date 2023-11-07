import {Component, Event, EventEmitter, h, Prop, State, Watch} from "@stencil/core";
import {ShowToastEventArgs} from "../../app/app";
import {ITransactionStatus, TokenScript} from "../../../../../engine-js/src/TokenScript";
import {IViewBinding} from "../../../../../engine-js/src/view/IViewBinding";
import {RequestFromView, ViewEvent} from "../../../../../engine-js/src/view/ViewController";
import {Card} from "../../../../../engine-js/src/tokenScript/Card";
import {AbstractViewBinding, VIEW_BINDING_JAVASCRIPT} from "../../../integration/abstractViewBinding";
import {handleTransactionError, showTransactionNotification} from "../../viewers/util/showTransactionNotification";


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

		if (!this.iframe || !this.iframe.src)
			return;

		if (event.source !== this.iframe.contentWindow) {
			return; // Skip message in this event listener
		}

		if (!event.data?.method)
			return;

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

			case RequestFromView.CLOSE:
				this.unloadTokenView()
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

	protected postMessageToView(method: ViewEvent, params: any) {
		this.iframe.contentWindow.postMessage({method, params}, "*");
	}

	async showTokenView(card: Card, tsId?: string) {

		this.loading = true;
		await this.dialog.openDialog(() => this.unloadTokenView());
		this.currentCard = card;

		await AbstractViewBinding.injectContentView(this.iframe, card);
	}

	async unloadTokenView() {
		await this.dialog.closeDialog();
		this.currentCard = null;
		this.iframe.src = "";
		document.location.hash = "#";
	}

	viewError(error: Error) {
		this.loading = false;
	}

	viewLoading() {
		this.loading = true;
	}

	// TODO: move this logic into engine
	async confirmAction(){

		const transaction = this.currentCard.getTransaction();

		this.loading = true;

		if (transaction){

			console.log(transaction.getTransactionInfo());

			try {
				await this.currentCard.executeTransaction((data: ITransactionStatus) => {
					this.postMessageToView(ViewEvent.TRANSACTION_EVENT, data);
					showTransactionNotification(data, this.showToast);
				});
			} catch (e){
				this.postMessageToView(ViewEvent.TRANSACTION_EVENT, {status: "error", message: e.message});
				handleTransactionError(e, this.showToast);
			}

		} else {
			this.postMessageToView(ViewEvent.ON_CONFIRM, {});
		}

		this.loading = false
	}

	render(){
		return (
			<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement}>
				<div class="view-loader" style={{display: this.loading ? "flex" : "none"}}>
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

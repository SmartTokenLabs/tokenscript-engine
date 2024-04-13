import {Component, Element, Event, EventEmitter, h, Prop, State, Watch} from "@stencil/core";
import {ShowToastEventArgs} from "../../app/app";
import {ITransactionStatus, TokenScript} from "../../../../../engine-js/src/TokenScript";
import {IViewBinding} from "../../../../../engine-js/src/view/IViewBinding";
import {RequestFromView, ViewEvent} from "../../../../../engine-js/src/view/ViewController";
import {Card} from "../../../../../engine-js/src/tokenScript/Card";
import {AbstractViewBinding, VIEW_BINDING_JAVASCRIPT} from "../../../integration/abstractViewBinding";
import {handleTransactionError, showTransactionNotification} from "../../viewers/util/showTransactionNotification";
import {RpcResponse} from "../../../../../engine-js/src/wallet/IWalletAdapter";
import {showToastNotification} from "../../viewers/util/showToast";
import {CHAIN_CONFIG} from "../../../integration/constants";


@Component({
	tag: 'card-popover',
	styleUrl: 'card-popover.css',
	shadow: false,
	scoped: false
})
export class CardPopover implements IViewBinding {

	@Element()
	el: HTMLElement;

	private dialog: HTMLPopoverDialogElement;
	private iframe: HTMLIFrameElement;

	@Prop()
	tokenScript: TokenScript;

	@State()
	loading: boolean = false;

	@State()
	currentCard?: Card;

	@State()
	buttonOptions?: { show: boolean, disable: boolean, text: string };

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

		this.iframe = this.el.getElementsByClassName('tokenscript-frame')[0] as HTMLIFrameElement;
		window.addEventListener("message", this.handlePostMessageFromView.bind(this));
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

		console.log("Request from view: ", method, params);

		switch (method){
			case RequestFromView.SET_LOADER:
				if (params.show == true){
					this.loading = true;
				} else {
					this.hideLoader();
				}
				break;
			case RequestFromView.SHOW_TX_TOAST:
				showTransactionNotification({
					status: params.status,
					txLink: CHAIN_CONFIG[params?.chain].explorer ?  CHAIN_CONFIG[params?.chain].explorer + params.txHash : null,
					txNumber: params.txHash
				}, this.showToast)
				break;
			case RequestFromView.SHOW_TOAST:
				showToastNotification(params.type, params.title, params.description);
				break;
			case RequestFromView.SET_BUTTON:
				const newOptions = {...this.buttonOptions};
				for (const i in params){
					newOptions[i] = params[i];
				}
				this.buttonOptions = newOptions;
				break;
			case RequestFromView.EXEC_TRANSACTION:
				this.confirmAction();
				break;
			default:
				await this.tokenScript.getViewController().handleMessageFromView(method, params);
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
			case ViewEvent.TRANSACTION_EVENT:
				this.postMessageToView(event, {...data, id});
				return;
		}
	}

	protected postMessageToView(method: ViewEvent, params: any) {
		if (this.iframe.contentWindow)
			this.iframe.contentWindow.postMessage({method, params}, "*");
	}

	dispatchRpcResult(response: RpcResponse) {
		if (this.iframe.contentWindow)
			return this.iframe.contentWindow.postMessage(response, "*");
	}

	async showTokenView(card: Card, tsId?: string) {

		this.loading = true;
		this.currentCard = card;

		this.buttonOptions = {
			show: this.currentCard?.type == "action" && this.currentCard.uiButton,
			disable: false,
			text: this.currentCard.label
		};

		this.iframe = await AbstractViewBinding.injectContentView(this.iframe, card, this.tokenScript.getViewController());
		this.iframe.onload = () => {
			this.hideLoader()
		}

		await this.dialog.openDialog(() => this.unloadTokenView());
	}

	async unloadTokenView() {
		await this.dialog.closeDialog();
		this.currentCard = null;
		//this.iframe.srcdoc = "<!DOCTYPE html>";
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
			<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement} disableClose={this.loading}>
				<div slot="outer-content" class="view-loader" style={{display: this.loading ? "flex" : "none"}}>
					<loading-spinner/>
				</div>
				<div class="card-container view-container">
					<div class="iframe-wrapper">
						<iframe class="tokenscript-frame"
								sandbox="allow-scripts allow-modals allow-forms allow-popups allow-popups-to-escape-sandbox">
						</iframe>
					</div>
					{this.buttonOptions ?
						(<div class="action-bar" style={{display: this.buttonOptions.show ? "block" : "none"}}>
							<button class="action-btn btn btn-primary"
									disabled={this.buttonOptions.disable}
									onClick={() => this.confirmAction()}>{this.buttonOptions.text}</button>
						</div>) : ''
					}
				</div>
			</popover-dialog>
		)
	}
}

import {Component, Element, Event, EventEmitter, h, Prop, State, Watch} from "@stencil/core";
import {ShowToastEventArgs} from "../../app/app";
import {ITransactionStatus} from "../../../../../engine-js/src/ITokenScript";
import {TokenScript} from "../../../../../engine-js/src/TokenScript";
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
	el: HTMLDivElement;

	private iframeTemplate: HTMLIFrameElement;

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
		this.tokenScript.on("TX_STATUS", (data: ITransactionStatus) => {
			if (data.status !== "error"){
				showTransactionNotification(data, this.showToast);
			} else {
				handleTransactionError(data.error, this.showToast);
			}
		}, "card-popover");
	}

	async componentDidLoad() {
		if (this.tokenScript)
			await this.loadTs();

		this.iframeTemplate = this.el.getElementsByClassName('tokenscript-frame')[0] as HTMLIFrameElement;
		window.addEventListener("message", this.handlePostMessageFromView.bind(this));
	}

	hideLoader(){
		this.loading = false;
	}

	showLoader(show= true) {
		if (show){
			this.loading = true;
		} else {
			this.hideLoader();
		}
	}

	getViewBindingJavascript(): string {
		return VIEW_BINDING_JAVASCRIPT;
	}

	protected async handlePostMessageFromView(event: MessageEvent) {

		if (!this.iframe)
			return;

		if (event.source !== this.iframe.contentWindow) {
			return; // Skip message in this event listener
		}

		if (!event.data?.method)
			return;

		await this.handleMessageFromView(event.data.method, event.data?.params);
	}

	async handleMessageFromView(method: RequestFromView, params: any) {

		console.log("Request from view: ", method, params);

		switch (method){
			case RequestFromView.SET_LOADER:
				this.showLoader(params.show);
				break;
			case RequestFromView.SHOW_TX_TOAST:
				await showTransactionNotification({
					status: params.status,
					txLink: CHAIN_CONFIG[params?.chain].explorer ?  CHAIN_CONFIG[params?.chain].explorer + params.txHash : null,
					txNumber: params.txHash
				}, this.showToast)
				break;
			case RequestFromView.SHOW_TOAST:
				await showToastNotification(params.type, params.title, params.description);
				break;
			case RequestFromView.SET_BUTTON:
				const newOptions = {...this.buttonOptions};
				for (const i in params){
					newOptions[i] = params[i];
				}
				this.buttonOptions = newOptions;
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
				return;

			default:
				this.postMessageToView(event, {...data, id});
				return;
		}
	}

	protected postMessageToView(method: ViewEvent, params: any) {
		if (this.iframe?.contentWindow)
			this.iframe.contentWindow.postMessage({method, params}, "*");
	}

	dispatchRpcResult(response: RpcResponse) {
		if (this.iframe?.contentWindow)
			return this.iframe.contentWindow.postMessage(response, "*");
	}

	async showTokenView(card: Card, tsId?: string) {

		this.loading = true;
		this.currentCard = card;

		this.buttonOptions = {
			show: (this.currentCard?.type == "action" || this.currentCard?.type == "onboarding") && this.currentCard.uiButton,
			disable: false,
			text: this.currentCard.label
		};

		// changing srcdoc adds to the parent pages history and there's no way to avoid this except for removing the iframe and adding a new one
		const newIframe = this.iframeTemplate.cloneNode(true) as HTMLIFrameElement;
		newIframe.style.display = "";

		this.iframe = await AbstractViewBinding.injectContentView(newIframe, card, this.tokenScript.getViewController());
		this.el.getElementsByClassName("iframe-wrapper")[0].innerHTML = "";
		this.el.getElementsByClassName("iframe-wrapper")[0].appendChild(this.iframe);
		this.iframe.onload = () => {
			this.hideLoader()
		}

		if (card.view){
			const currentParams = new URLSearchParams(location.hash.substring(1));
			currentParams.set("card", card.name);

			const token = this.tokenScript.getCurrentTokenContext();
			if (token && "selectedTokenId" in token){
				currentParams.set("tokenId", token.selectedTokenId);
			}

			history.replaceState(undefined, undefined, "#" + currentParams.toString());
		}

		await this.dialog.openDialog(() => this.tokenScript.getViewController().unloadTokenCard());
	}

	async unloadTokenView() {
		await this.dialog.closeDialog();
		this.currentCard = null;
		//this.iframe.srcdoc = "<!DOCTYPE html>";
		this.iframe.remove();
		//this.iframe.contentWindow.location.replace("data:text/html;base64,PCFET0NUWVBFIGh0bWw+");
		const currentParams = new URLSearchParams(location.hash.substring(1));
		currentParams.delete("card");
		currentParams.delete("tokenId");
		history.replaceState(undefined, undefined, "#" + currentParams.toString());
	}

	viewError(error: Error) {
		this.loading = false;
	}

	viewLoading() {
		this.loading = true;
	}

	async confirmAction(){
		await this.tokenScript.getViewController().executeTransaction();
	}

	render(){
		return (
			<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement} disableClose={this.loading} fullScreen={this.currentCard?.fullScreen} showShareToTg={true}>
				<div slot="outer-content" class="view-loader" style={{display: this.loading ? "flex" : "none"}}>
					<loading-spinner/>
				</div>
				<div class={"card-container view-container" + (this.currentCard?.fullScreen ? ' fullscreen ' : '')}>
					<div class="iframe-wrapper">

					</div>
					<div id="iframe-template" style={{display: "none !important"}}>
						<iframe class="tokenscript-frame"
						        allow="clipboard-write"
						        frameborder="0"
								sandbox="allow-scripts allow-modals allow-forms allow-popups allow-popups-to-escape-sandbox">
						</iframe>
					</div>
					{this.buttonOptions ?
						(<div class="action-bar" style={{display: this.buttonOptions.show ? "block" : "none"}}>
							<button class="ts-action-button action-btn btn btn-primary"
									disabled={this.buttonOptions.disable}
									onClick={() => this.confirmAction()}>{this.buttonOptions.text}</button>
						</div>) : ''
					}
				</div>
			</popover-dialog>
		)
	}
}

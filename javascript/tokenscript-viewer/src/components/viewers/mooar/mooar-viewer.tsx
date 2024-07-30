import {Component, Event, EventEmitter, h, Host, JSX, Prop, State, Element} from "@stencil/core";
import {AppRoot, ShowToastEventArgs} from "../../app/app";
import {ITransactionStatus, TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {getSingleTokenMetadata} from "../util/getSingleTokenMetadata";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {handleTransactionError, showTransactionNotification} from "../util/showTransactionNotification";
import {getCardButtonClass} from "../util/getCardButtonClass";
import {ViewBinding} from "../tabbed/viewBinding";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {getTokenScriptWithSingleTokenContext} from "../util/getTokenScriptWithSingleTokenContext";
import {getTokenUrlParams} from "../util/getTokenUrlParams";
import {invokeDeeplink} from "../util/invokeDeeplink";
import {connectEmulatorSocket} from "../util/connectEmulatorSocket";
import {ViewController} from "@tokenscript/engine-js/src/view/ViewController";

@Component({
	tag: 'mooar-viewer',
	styleUrl: 'mooar-viewer.css',
	shadow: false,
	scoped: false
})
export class SmartTokenStoreViewer {

	@Prop()
	app: AppRoot;

	collectionDetails: ITokenCollection;
	tokenDetails: ITokenDetail;

	@State()
	tokenScript: TokenScript;

	@State() cardButtons: JSX.Element[]|undefined;

	@State() overflowCardButtons: JSX.Element[];

	private overflowDialog: HTMLActionOverflowModalElement;

	private infoCard?: Card;

	private infoCardView: HTMLElement;

	private infoViewController: ViewController;

	@Event({
		eventName: 'showToast',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) showToast: EventEmitter<ShowToastEventArgs>;

	@Event({
		eventName: 'showLoader',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) showLoader: EventEmitter<void>;

	@Event({
		eventName: 'hideLoader',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) hideLoader: EventEmitter<void>;

	async componentDidLoad(){

		try {
			await this.processUrlLoad();
		} catch (e){
			console.error(e);
			this.showToast.emit({
				type: 'error',
				title: "Failed to load token details",
				description: e.message
			});
		}
	}

	async processUrlLoad(){

		let {chain, contract, tokenId, tokenscriptUrl, emulator} = getTokenUrlParams();

		this.app.showTsLoader();

		// TODO: Get from URL to speed up load time
		const res = await getSingleTokenMetadata(chain, contract, tokenId, this.app.tsEngine);
		this.collectionDetails = res.collection;
		this.tokenDetails = res.detail;
		console.log("Token meta loaded!", this.collectionDetails, this.tokenDetails);

		this.app.hideTsLoader();

		if (emulator){
			const emulatorUrl = new URL(decodeURIComponent(emulator)).origin;
			tokenscriptUrl = emulatorUrl + "/tokenscript.tsml";
			connectEmulatorSocket(emulatorUrl, async() => {
				await this.loadTokenScript(chain, contract, tokenId, tokenscriptUrl);
			});
		}

		await this.loadTokenScript(chain, contract, tokenId, tokenscriptUrl);
	}

	private async loadTokenScript(chain: number, contract: string, tokenId: string, tokenScriptUrl?: string){

		this.tokenScript = await getTokenScriptWithSingleTokenContext(this.app, chain, contract, this.collectionDetails, this.tokenDetails, tokenId, tokenScriptUrl);

		// Reload cards after the token is updated
		this.tokenScript.on("TOKENS_UPDATED", (data) => {
			this.cardButtons = null;
			this.overflowCardButtons = null;
			this.infoCard = null;
			this.loadCards();
		}, "grid");

		await this.loadCards();
		await invokeDeeplink(this.tokenScript, this.showToast, this.showCard.bind(this));
	}

	// TODO: Deduplicate logic in common/tokens-grid-item.tsx & viewers/joyid-token/action-bar.tsx
	private async loadCards(){

		const cardButtons: JSX.Element[] = [];
		const overflowCardButtons: JSX.Element[] = [];
		this.infoCard = null;

		const cards = this.tokenScript.getCards();

		for (let [index, card] of cards.entries()){

			let label = card.label;

			if (card.type === "token" && !this.infoCard){
				// Show first info card
				this.infoCard = card;
				if (!this.infoViewController) {
					const infoViewBinding = new ViewBinding(this.infoCardView, this.showToast);
					this.infoViewController = this.tokenScript.getViewController(infoViewBinding);
					infoViewBinding.setViewController(this.infoViewController);
				}
				this.infoViewController.showOrExecuteCard(this.infoCard, undefined);
				continue;
			}

			if (label === "Unnamed Card")
				label = card.type === "token" ? "Token Info" : card.type + " Card";

			try {
				const enabled = await card.isEnabledOrReason();

				if (enabled === false)
					continue;

				const cardElem = (
					<button class={"ts-card-button btn " + getCardButtonClass(card, index)}
							onClick={() => {
								if (enabled !== true){
									this.showToast.emit({
										type: 'error',
										title: "Action not available",
										description: enabled
									});
									return;
								}
								this.showCard(card)
							}}
							disabled={enabled !== true}
							title={enabled !== true ? enabled : label}>
						<span>{label}</span>
					</button>
				)

				if (enabled !== true || cardButtons.length > 2){
					overflowCardButtons.push(cardElem);
				} else {
					cardButtons.push(cardElem);
				}
			} catch (e){
				console.error("Failed to check if card is available", e);
			}
		}

		this.cardButtons = cardButtons;
		this.overflowCardButtons = overflowCardButtons;
	}

	// TODO: This is copied from tokens-grid-item, dedupe required
	private async showCard(card: Card){

		this.showLoader.emit();

		try {
			await this.tokenScript.showOrExecuteTokenCard(card, async (data: ITransactionStatus) => {

				if (data.status === "started")
					this.showLoader.emit();

				if (data.status === "confirmed")
					this.hideLoader.emit();

				await showTransactionNotification(data, this.showToast);
			});

		} catch(e){
			console.error(e);
			handleTransactionError(e, this.showToast);
		}

		this.hideLoader.emit();
	}

	render(){

		return (
			<Host>
				<div class="mooar-viewer">
					<div class="mooar-header">
						<a href="https://www.smartlayer.network/" target="_blank">
							<span>Smart Token Viewer</span>
							<img class="header-icon" alt="SmartLayer Network" src="assets/icon/smart-layer-icon.png"/>
						</a>
					</div>
					<card-view ref={(el: HTMLElement) => this.infoCardView = el}></card-view>
					{this.cardButtons?.length !== 0 ?
						<div class="actions">
							{this.cardButtons ?
								this.cardButtons :
								<loading-spinner color={"#595959"} size={"small"} style={{textAlign: "center"}}/>
							}
							{this.overflowCardButtons?.length ?
								[
									(<button class="btn more-actions-btn"
									         onClick={() => this.overflowDialog.openDialog()}>
										<span>+ More actions</span>
									</button>),
									(<action-overflow-modal
										ref={(el) => this.overflowDialog = el as HTMLActionOverflowModalElement}>
										<div class="actions">
											{this.overflowCardButtons}
										</div>
									</action-overflow-modal>)
								] : ''
							}
						</div>
					: ''}
					<card-popover tokenScript={this.tokenScript}></card-popover>
				</div>
			</Host>
		)
	}

}

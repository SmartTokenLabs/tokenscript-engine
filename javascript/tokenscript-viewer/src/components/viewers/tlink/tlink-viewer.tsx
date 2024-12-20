import {Component, Event, EventEmitter, h, Host, JSX, Prop, State} from "@stencil/core";
import {AppRoot, ShowToastEventArgs} from "../../app/app";
import {ITransactionStatus} from "@tokenscript/engine-js/src/ITokenScript";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {Card, CardType} from "@tokenscript/engine-js/src/tokenScript/Card";
import {handleTransactionError, showTransactionNotification} from "../util/showTransactionNotification";
import {getCardButtonClass} from "../util/getCardButtonClass";
import {ViewBinding} from "../tabbed/viewBinding";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {getTokenScriptWithSingleTokenContext} from "../util/getTokenScriptWithSingleTokenContext";
import {getTokenUrlParams} from "../util/getTokenUrlParams";
import {connectEmulatorSocket} from "../util/connectEmulatorSocket";
import {ViewController} from "@tokenscript/engine-js/src/view/ViewController";
import {findCardByUrlParam} from "../util/findCardByUrlParam";

@Component({
	tag: 'tlink-viewer',
	styleUrl: 'tlink-viewer.css',
	shadow: false,
	scoped: false
})
export class TlinkViewer {

	@Prop()
	app: AppRoot;

	collectionDetails: ITokenCollection;
	tokenDetails: ITokenDetail;
	tokenId?: string;
	card?: string;

	@State()
	tokenScript: TokenScript;

	@State() cardButtons: JSX.Element[]|undefined;

	@State() overflowCardButtons: JSX.Element[];

	private overflowDialog: HTMLActionOverflowModalElement;

	private mainCard?: Card;

	private mainCardView: HTMLElement;

	private mainViewController: ViewController;

	private onboardingSelected = false;

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

		let {chain, contract, originId, tokenId, scriptId, tokenscriptUrl, emulator, card} = getTokenUrlParams();

		this.tokenId = tokenId;
		this.card = card;

		this.app.showTsLoader();

		if (emulator){
			const emulatorUrl = new URL(decodeURIComponent(emulator)).origin;
			tokenscriptUrl = emulatorUrl + "/tokenscript.tsml";
			connectEmulatorSocket(emulatorUrl, async() => {
				await this.loadTokenScript(chain, contract, originId, tokenId, scriptId, tokenscriptUrl);
			});
		}

		await this.loadTokenScript(chain, contract, originId, tokenId, scriptId, tokenscriptUrl);

		this.app.hideTsLoader();
	}

	private async loadTokenScript(chain: number, contract: string, originId?: string, tokenId?: string, scriptId?: string, tokenScriptUrl?: string){

		this.tokenScript = await getTokenScriptWithSingleTokenContext(this.app, chain, contract, scriptId, originId, null, null, tokenId, tokenScriptUrl);

		// Reload cards after the token is updated
		this.tokenScript.on("TOKENS_UPDATED", (data) => {
			this.cardButtons = null;
			this.overflowCardButtons = null;
			this.loadCards();
		}, "grid");

		await this.loadCards();
	}

	private async loadCards(reloadInfoView = false){

		const cardButtons: JSX.Element[] = [];
		const overflowCardButtons: JSX.Element[] = [];

		// Get the specific card that has been deep-linked, falling back to the first onboarding or token card
		if (this.card){

			const cardRes = findCardByUrlParam(this.card, this.tokenScript);

			if (cardRes?.card) {
				if (await cardRes.card.isEnabledOrReason() === true) {
					this.mainCard = cardRes.card;
					this.onboardingSelected = true;
				}
			} else {
				this.showToast.emit({
					type: 'error',
					title: "Card not found",
					description: "The card '" + this.card + "' cannot be found."
				});
			}
		}

		if (!this.mainCard){
			// Get first token card or onboarding card
			let cards = this.tokenScript.getCards().filterCards(this.tokenScript.getCurrentTokenContext().originId, this.onboardingSelected ? ["onboarding"] : ["token"]);

			if (!cards.length){
				this.showToast.emit({
					type: 'error',
					title: "Card not found",
					description: "Cannot find a default token or onboarding card"
				});
				return;
			}

			this.mainCard = cards[0];
		}

		let includedTypes: CardType[];

		if (this.onboardingSelected){
			includedTypes = ["onboarding"];
		} else {
			includedTypes = ["token", "action", "activity", "public"];
		}

		// Load other cards
		const cards = this.tokenScript.getCards().filterCards(this.tokenScript.getCurrentTokenContext().originId, includedTypes);

		for (let [index, card] of cards.entries()){

			let label = card.label;

			// Ignore the main card loaded from a deeplink
			if (this.mainCard.name === card.name)
				continue;

			if (label === "Unnamed Card")
				label = (card.type as CardType) === "token" ? "Token Info" : card.type + " Card";

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

		// The card is already loaded, we only need to update other card buttons
		if (reloadInfoView || !this.mainViewController) {
			const mainViewBinding = new ViewBinding(this.mainCardView, this.showToast);
			this.mainViewController = this.tokenScript.getViewController(mainViewBinding);
			mainViewBinding.setViewController(this.mainViewController);
			this.mainViewController.showOrExecuteCard(this.mainCard, undefined);
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
				<div class="tlink-viewer">
					<style innerHTML={this.tokenScript ? this.tokenScript.viewStyles.getViewCss() : ""}/>
					<div class="tlink-header">
						<a href="https://www.smartlayer.network/" target="_blank">
							<img class="header-icon" alt="SmartLayer Network" src="assets/icon/smart-layer-icon.png"/>
							<span class="text">Tapp Viewer</span>
						</a>
						<div class="tlink-header-right">
							{/*<share-to-tg-button/>*/}
							{this.tokenScript && <security-status tokenScript={this.tokenScript} size="small" margin="0" />}
							{this.tokenScript &&
								<tokens-selector tokenScript={this.tokenScript} switchToken={async (token) => {
									// TODO: Allow removing token context so this flag isn't needed?
									if (token) {
										this.tokenScript.setCurrentTokenContext(token.originId, null, token.tokenId);
										this.onboardingSelected = false;
									} else {
										this.onboardingSelected = true;
									}
									this.card = null;
									this.mainCard = null;
									await this.mainViewController.unloadTokenCard();
									await this.loadCards();
									await this.mainViewController.showOrExecuteCard(this.mainCard, undefined);
								}}/>}
						</div>
					</div>
					<card-view ref={(el: HTMLElement) => this.mainCardView = el}></card-view>
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

import {Component, Event, EventEmitter, h, JSX, Prop, State, Watch} from "@stencil/core";
import {ITransactionStatus, TokenScript} from "../../../../../engine-js/src/TokenScript";
import {Card} from "../../../../../engine-js/src/tokenScript/Card";
import {handleTransactionError, showTransactionNotification} from "../util/showTransactionNotification";
import {ShowToastEventArgs} from "../../app/app";
import {TokenScriptEngine} from "../../../../../engine-js/src/Engine";
import {ITokenDetail} from "../../../../../engine-js/src/tokens/ITokenDetail";

@Component({
	tag: 'action-bar',
	styleUrl: 'action-bar.css',
	shadow: false,
	scoped: false
})
export class ActionBar {

	private overflowDialog: HTMLActionOverflowModalElement;
	private transferDialog: HTMLTransferDialogElement;

	@Prop()
	engine: TokenScriptEngine;

	@Prop()
	tokenDetails?: ITokenDetail;

	@Prop()
	tokenScript?: TokenScript;

	@Prop()
	actionsEnabled?: boolean;

	@State() cardButtons: JSX.Element[]|undefined;

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

	@Watch("tokenScript")
	private async initTokenScript (){
		this.loadCardButtons();

		this.tokenScript.on("TOKENS_UPDATED", () => {
			this.cardButtons = undefined;
			this.loadCardButtons();
		})
	}

	componentDidLoad(){
		if (this.tokenScript)
			this.initTokenScript();
	}

	// TODO: This is copied from tokens-grid-item, dedupe required
	private async loadCardButtons(){

		const cardButtons: JSX.Element[] = [];

		const cards = this.tokenScript.getCards();

		for (let [index, card] of cards.entries()){

			let label = card.label;

			if (label === "Unnamed Card")
				label = card.type === "token" ? "Token Info" : card.type + " Card";

			try {
				const enabled = await card.isEnabledOrReason();

				if (enabled === false)
					continue;

				cardButtons.push((
					<button class={"jid-btn " + this.getCardButtonClass(card, index)}
							onClick={() => this.showCard(card)}
							disabled={enabled !== true}
							title={enabled !== true ? enabled : label}>
						{label}
					</button>
				));
			} catch (e){
				console.error("Failed to check if card is available", e);
			}
		}

		this.cardButtons = cardButtons;
	}

	private getCardButtonClass(card: Card, index: number){

		switch (card.buttonClass){
			case "featured":
				return "btn-featured";
			case "primary":
				return "btn-primary";
			case "secondary":
				return "jid-btn-secondary";
			default:
				return card.type === "token" || index === 0 ? "btn-primary" : "jid-btn-secondary";
		}
	}

	// TODO: This is copied from tokens-grid-item, dedupe required
	private async showCard(card: Card){

		window.scrollTo(0, 0);

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
			this.hideLoader.emit();
			handleTransactionError(e, this.showToast);
			return;
		}
	}

	private actionsAvailable(){
		if (!this.actionsEnabled){
			this.showToast.emit({
				type: 'error',
				title: "Action is not available now",
				description: "Please try again later"
			});
			return false;
		}

		return true;
	}

	render(){
		return (
			<div class="jid-action-bar">
				{ this.tokenScript ?
					[
						(<button class="jid-btn jid-overflow-btn" onClick={() => {
							if (!this.actionsAvailable())
								return;
							this.overflowDialog.openDialog()
						}}>
							<img alt="more actions" src="/assets/icon/joyid/arrow-square-down.png"/> More
						</button>),
						(<action-overflow-modal ref={(el) => this.overflowDialog = el as HTMLActionOverflowModalElement}>
							<h2 class="overflow-heading">More actions</h2>
							<div class="overflow-buttons">
								{this.cardButtons ? this.cardButtons : <loading-spinner color={"#595959"}/>}
							</div>
						</action-overflow-modal>)
					] : ''
				}
				<button class="jid-btn jid-transfer-btn" onClick={() => {
					if (!this.actionsAvailable())
						return;
					this.transferDialog.openDialog()
				}}>Transfer</button>
				<transfer-dialog engine={this.engine}
								 tokenDetails={this.tokenDetails}
								 ref={(el) => this.transferDialog = el as HTMLTransferDialogElement} />
			</div>
		)
	}
}

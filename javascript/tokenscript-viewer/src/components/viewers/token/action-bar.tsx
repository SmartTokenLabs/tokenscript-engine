import {Component, Event, EventEmitter, h, JSX, Prop, State, Watch} from "@stencil/core";
import {ITransactionStatus, TokenScript} from "../../../../../engine-js/src/TokenScript";
import {Card} from "../../../../../engine-js/src/tokenScript/Card";
import {showTransactionNotification} from "../util/showTransactionNotification";
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
		await this.loadCardButtons();

		this.tokenScript.on("TOKENS_UPDATED", () => {
			this.cardButtons = undefined;
			this.loadCardButtons();
		})
	}

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
					<button class="jid-btn"
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

	// TODO: This is copied from tokens-grid, dedupe required
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
			this.showToast.emit({
				type: 'error',
				title: "Transaction Error",
				description: e.message
			});
			return;
		}
	}

	render(){
		return (
			<div class="jid-action-bar">
				{ this.cardButtons?.length ?
					[
						(<button class="jid-btn jid-overflow-btn" onClick={() => this.overflowDialog.openDialog()}>
							<img alt="more actions" src="/assets/icon/joyid/arrow-square-down.png"/> More
						</button>),
						(<action-overflow-modal ref={(el) => this.overflowDialog = el as HTMLActionOverflowModalElement}>
							<h2 class="overflow-heading">More actions</h2>
							<div class="overflow-buttons">
								{this.cardButtons}
							</div>
						</action-overflow-modal>)
					] : ''
				}
				<button class="jid-btn jid-transfer-btn" onClick={() => this.transferDialog.openDialog()}>Transfer</button>
				<transfer-dialog engine={this.engine}
								 tokenDetails={this.tokenDetails}
								 ref={(el) => this.transferDialog = el as HTMLTransferDialogElement} />
			</div>
		)
	}
}

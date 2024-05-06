import {Component, h, State, Element, Method, Host, Event, EventEmitter} from "@stencil/core";
import {ITransactionStatus, TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {getCardButtonClass} from "../../util/getCardButtonClass";
import {handleTransactionError, showTransactionNotification} from "../../util/showTransactionNotification";
import {ShowToastEventArgs} from "../../../app/app";
import {TokenGridContext} from "../../util/getTokensFlat";

@Component({
	tag: 'viewer-popover',
	styleUrl: 'viewer-popover.css',
	shadow: false,
	scoped: false
})
export class ViewerPopover {

	@Element()
	host;

	@State()
	tokenScript?: TokenScript;

	@State()
	onboardingCards?: Card[];

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

	@Method()
	async open(tokenScript: TokenScript){
		this.tokenScript = tokenScript;

		const onboardingCards = tokenScript.getCards(null, true);

		const enabledCards = [];

		for (let [index, card] of onboardingCards.entries()){

			let label = card.label;

			if (label === "Unnamed Card")
				label = card.type === "token" ? "Token Info" : card.type + " Card";

			try {
				const enabled = await card.isEnabledOrReason();

				console.log("Card enabled: ", enabled);

				if (enabled === false)
					continue;

				const cardElem = (
					<button class={"ts-card-button btn " + getCardButtonClass(card, index)}
							onClick={() => this.showCard(card)}
							disabled={enabled !== true}
							title={enabled !== true ? enabled : label}>
						<span>{label}</span>
					</button>
				)

				enabledCards.push(cardElem);

			} catch (e){
				console.error("Failed to check if card is available", e);
			}
		}

		this.onboardingCards = enabledCards;
	}

	private async showCard(card: Card, token?: TokenGridContext, cardIndex?: number){

		if (token) {
			const refs = token.contextId.split("-");
			this.tokenScript.setCurrentTokenContext(refs[0], refs.length > 1 ? parseInt(refs[1]) : null);
		} else {
			this.tokenScript.unsetTokenContext();
		}

		this.showLoader.emit();

		try {
			await this.tokenScript.showOrExecuteTokenCard(card, async (data: ITransactionStatus) => {

				if (data.status === "started")
					this.showLoader.emit();

				if (data.status === "confirmed")
					this.hideLoader.emit();

				await showTransactionNotification(data, this.showToast);
			});

			// TODO: set only card param rather than updating the whole hash query
			if (card.view)
				history.replaceState(undefined, undefined, "#card=" + (card.name ?? cardIndex) + ((token && "tokenId" in token) ? "&tokenId=" + token.tokenId : ''));

		} catch(e){
			console.error(e);
			this.hideLoader.emit();
			handleTransactionError(e, this.showToast);
			return;
		}

		this.hideLoader.emit();
	}

	@Method()
	async close(){
		this.tokenScript = null;
	}

	render(){
		return ( this.tokenScript ?
			<Host class={(this.tokenScript ? " open" : "")}>
				<style innerHTML={this.tokenScript ? this.tokenScript.viewStyles.getViewCss() : ""} />
				<div class="toolbar">
					<div class="view-heading">
						<button class="btn" onClick={() => this.close()}>&lt;</button>
						<h3>{this.tokenScript.getLabel() ?? this.tokenScript.getName()}</h3>
					</div>
					<div class="view-toolbar-buttons">
						<security-status tokenScript={this.tokenScript}/>
						<div>
							<button class="btn" style={{marginRight: "5px", minWidth: "35px", fontSize: "16px"}}
									onClick={() => {
										this.tokenScript.getCards().forEach((card) => {
											card.getAttributes().invalidate()
										})
										this.tokenScript.getAttributes().invalidate()
										this.tokenScript.getTokenMetadata(true, true)
									}}>↻
							</button>
							<wallet-button></wallet-button>
						</div>
					</div>
				</div>
				<div class="meta-details">
					{ this.tokenScript.getMetadata().description ?
						<p>
							{ this.tokenScript.getMetadata().description}
						</p> : ''
					}
					{ this.tokenScript.getMetadata().aboutUrl ?
						<a href={this.tokenScript.getMetadata().aboutUrl} target="_blank">
							{ "Discover how it works" }
							<img alt="about" src="/assets/icon/question.svg" />
						</a> : ''
					}
				</div>
				{ this.onboardingCards ? (<div class="onboarding-cards">
						{this.onboardingCards}
				</div>) : ''}
				<tokens-grid tokenScript={this.tokenScript} showCard={this.showCard}></tokens-grid>
				{/*<card-modal tokenScript={this.tokenScript}></card-modal>*/}
				<card-popover tokenScript={this.tokenScript}></card-popover>
			</Host> : ''
		)
	}
}

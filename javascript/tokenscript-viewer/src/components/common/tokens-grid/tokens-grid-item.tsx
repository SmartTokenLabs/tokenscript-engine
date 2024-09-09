import {Component, h, Host, JSX, Prop, State, Watch} from "@stencil/core";
import {ITokenIdContext} from "@tokenscript/engine-js/src/ITokenScript";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {TokenGridContext} from "../../viewers/util/getTokensFlat";
import {EthUtils} from "@tokenscript/engine-js/src/ethereum/EthUtils";
import {getCardButtonClass} from "../../viewers/util/getCardButtonClass";
import { previewAddr } from '@tokenscript/engine-js/src/utils';

@Component({
	tag: 'tokens-grid-item',
	styleUrl: 'tokens-grid-item.css',
	shadow: false,
	scoped: false
})
export class TokensGridItem {

	@Prop() tokenScript: TokenScript;

	@Prop() token: TokenGridContext;

	@Prop() showCard: (card: Card, token: TokenGridContext, index: number) => void;

	@Prop() openActionOverflowModal: (buttons: JSX.Element[]) => void;

	@State() cardButtons: JSX.Element[];

	@State() overflowCardButtons: JSX.Element[];

	private overflowDialog: HTMLActionOverflowModalElement;

	async componentDidLoad() {
		await this.loadCardButtons();
	}

	@Watch("tokenScript")
	private async loadCardButtons(){

		const cardButtons: JSX.Element[] = [];
		const overflowCardButtons: JSX.Element[] = [];

		// TODO: Rework NFT/fungible interfaces so they are cross compatible
		const context: ITokenIdContext = {
			originId: this.token.originId,
			chainId: ("chainId" in this.token) ? this.token.chainId : this.token.collectionDetails.chainId,
			selectedTokenId: ("tokenId" in this.token) ? this.token.tokenId : undefined
		}

		const cards = this.tokenScript.getCards().filterCards(this.token.originId);

		for (let [index, card] of cards.entries()){

			let label = card.label;

			if (label === "Unnamed Card")
				label = card.type === "token" ? "Token Info" : card.type + " Card";

			try {
				const enabled = await card.isEnabledOrReason(context);

				if (enabled === false)
					continue;

				const cardElem = (
					<button class={"ts-card-button btn " + getCardButtonClass(card, index)}
							onClick={() => this.showCard(card, this.token, index)}
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



	private showTokenInfo(token: TokenGridContext){
		(document.getElementById("token-info-popover") as HTMLTokenInfoPopoverElement).openDialog(token);
	}

	private async deleteAttestation(){
		if (("collectionId" in this.token) && confirm("Are you sure you want to delete this attestation?")) {
			await this.tokenScript.getEngine().getAttestationManager().removeAttestation(this.token.collectionId, this.token.tokenId);
			this.tokenScript.getTokenMetadata(true);
		}
	}

	render() {

		let title;
		let details;

		if ("tokenId" in this.token && this.token.tokenId){
			title = "#" + this.token.tokenId;
			details = this.token.name;
		} else {
			title = this.token.name;
		}

		return (
			<Host class="ts-token-container tokens-grid-item">
				<token-icon
					src={this.tokenScript.getMetadata().imageUrl ?
							this.tokenScript.getMetadata().imageUrl :
							this.token.image ?? this.tokenScript.getMetadata().iconUrl
					}
					imageTitle={this.token.name}/>
				<div class="tg-item-details">
					<div class="tg-item-heading">
						<h5>{previewAddr(title)}{"tokenId" in this.token ? <copy-icon copyText={this.token.tokenId} /> : ''}</h5>
						{
							details ?
								<span title={details}>{previewAddr(details)}</span>
								: ''
						}
						{
							this.token.tokenType !== "erc721" ?
								<span title={details}>Balance: {EthUtils.calculateDecimalValue(this.token.balance, this.token.decimals)}</span>
								: ''
						}
					</div>
					<button class="btn btn-secondary info-btn" onClick={() => this.showTokenInfo(this.token)}>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"
						     xmlns="http://www.w3.org/2000/svg">
							<path
								d="M10.8335 6.16634H13.1668V8.49967H10.8335V6.16634ZM10.8335 10.833H13.1668V17.833H10.8335V10.833ZM12.0002 0.333008C5.56016 0.333008 0.333496 5.55967 0.333496 11.9997C0.333496 18.4397 5.56016 23.6663 12.0002 23.6663C18.4402 23.6663 23.6668 18.4397 23.6668 11.9997C23.6668 5.55967 18.4402 0.333008 12.0002 0.333008ZM12.0002 21.333C6.85516 21.333 2.66683 17.1447 2.66683 11.9997C2.66683 6.85467 6.85516 2.66634 12.0002 2.66634C17.1452 2.66634 21.3335 6.85467 21.3335 11.9997C21.3335 17.1447 17.1452 21.333 12.0002 21.333Z"
								fill="currentColor" stroke="currentColor"/>
							<path
								d="M10.8335 6.16634H13.1668V8.49967H10.8335V6.16634ZM10.8335 10.833H13.1668V17.833H10.8335V10.833ZM12.0002 0.333008C5.56016 0.333008 0.333496 5.55967 0.333496 11.9997C0.333496 18.4397 5.56016 23.6663 12.0002 23.6663C18.4402 23.6663 23.6668 18.4397 23.6668 11.9997C23.6668 5.55967 18.4402 0.333008 12.0002 0.333008ZM12.0002 21.333C6.85516 21.333 2.66683 17.1447 2.66683 11.9997C2.66683 6.85467 6.85516 2.66634 12.0002 2.66634C17.1452 2.66634 21.3335 6.85467 21.3335 11.9997C21.3335 17.1447 17.1452 21.333 12.0002 21.333Z"
								fill="currentColor" stroke="currentColor"/>
						</svg>
					</button>
					<div class="actions">
						{this.cardButtons ?
							this.cardButtons :
							<loading-spinner color={"#595959"} size={"small"} style={{textAlign: "center"}}/>
						}
						{this.overflowCardButtons?.length ?
							(<button class="btn more-actions-btn ts-overflow-button"
							         onClick={() => this.openActionOverflowModal(this.overflowCardButtons)}>
								+ More actions
							</button>) : ''
						}
					</div>
				</div>
				<token-security-status tokenScript={this.tokenScript} originId={this.token.originId}/>
				{this.token?.data?.type === "eas" ? <button class="delete-attest-btn" title="Delete attestation"
				                                            onClick={() => this.deleteAttestation()}>X</button> : ''}
			</Host>
		)
	}
}

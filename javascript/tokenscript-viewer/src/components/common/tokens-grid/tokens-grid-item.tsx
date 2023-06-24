import {Component, h, Host, JSX, Prop, State} from "@stencil/core";
import {ITokenIdContext, TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {TokenGridContext} from "../../viewers/util/getTokensFlat";

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

	@State() cardButtons: JSX.Element[];

	async componentDidLoad() {

		const cardButtons: JSX.Element[] = [];
		const cards = this.tokenScript.getCards();

		for (let [index, card] of cards.entries()){

			let label = card.label;

			if (label === "Unnamed Card")
				label = card.type === "token" ? "Token Info" : card.type + " Card";

			// TODO: Rework NFT/fungible interfaces so they are cross compatible
			const context: ITokenIdContext = {
				chainId: ("chainId" in this.token) ? this.token.chainId : this.token.collectionDetails.chainId,
				selectedTokenId: ("tokenId" in this.token) ? this.token.tokenId : undefined
			}

			try {
				const enabled = await card.isEnabledOrReason(context);

				cardButtons.push((
					<button class={"btn " + (index === 0 ? "btn-primary" : "btn-secondary")}
							onClick={() => this.showCard(card, this.token, index)}
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
			<Host class="tokens-grid-item">
				<token-icon src={this.token.image} imageTitle={this.token.name}/>
				<div class="tg-item-details">
					<h5>{title}</h5>
					{
						details ?
							<span title={details}>{details}</span>
							: ''
					}
					<div class="actions">
						{ this.cardButtons ?
							this.cardButtons :
							<loading-spinner color={"#595959"} size={"small"} style={{textAlign: "center"}} />
						}
					</div>
				</div>
			</Host>
		)
	}
}

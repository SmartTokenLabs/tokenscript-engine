import {Component, h, JSX, Prop, State} from "@stencil/core";
import {ITokenContext, TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {IToken} from "@tokenscript/engine-js/src/tokens/IToken";
import {INFTTokenDetail} from "@tokenscript/engine-js/src/tokens/INFTTokenDetail";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {TokenGridContext} from "./tokens-grid";

@Component({
	tag: 'tokens-grid-item',
	styleUrl: 'tokens-grid-item.css',
	shadow: true,
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
			const context = {
				chainId: ("chainId" in this.token) ? this.token.chainId : this.token.collectionDetails.chainId,
				selectedNftId: ("tokenId" in this.token) ? this.token.tokenId : undefined
			}

			const enabled = await card.isEnabledOrReason(context);

			cardButtons.push((
				<button onClick={() => this.showCard(card, this.token, index)}
						disabled={enabled !== true}
						title={enabled !== true ? enabled : label}>
					{label}
				</button>
			));
		}

		this.cardButtons = cardButtons;
	}

	render() {
		return (
			<div class="tokens-grid-item">
				<token-icon src={this.token.image} imageTitle={this.token.name}/>
				<h5>{this.token.name}</h5>
				{
					"tokenId" in this.token ?
						<span title={this.token.tokenId.toString()}>#{this.token.tokenId}</span>
						: ''
				}
				<div class="actions">
					{ this.cardButtons ?
						this.cardButtons :
						<loading-spinner color={"#595959"} size={"small"} style={{textAlign: "center"}} />
					}
				</div>
			</div>
		)
	}
}

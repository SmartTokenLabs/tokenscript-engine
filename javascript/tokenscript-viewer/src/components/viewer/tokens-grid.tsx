import {Component, h, JSX, Prop, State, Watch} from "@stencil/core";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {IToken} from "@tokenscript/engine-js/src/tokens/IToken";
import {INFTTokenDetail} from "@tokenscript/engine-js/src/tokens/INFTTokenDetail";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";

export type TokenGridContext = (INFTTokenDetail | IToken) & { contextId: string; };

@Component({
	tag: 'tokens-grid',
	styleUrl: 'tokens-grid.css',
	shadow: false,
})
export class TokensGrid {

	@Prop() tokenScript: TokenScript;

	@Prop() showToast: (type: 'success'|'info'|'warning'|'error', title: string, description: string|JSX.Element) => void

	currentTokens?: {[key: string]: IToken};

	@State()
	currentTokensFlat?: TokenGridContext[];

	@Watch("tokenScript")
	async componentDidLoad() {

		await this.populateTokens(await this.tokenScript.getTokenMetadata());

		this.tokenScript.on("TOKENS_UPDATED", (data) => {
			this.populateTokens(data.tokens)
		})
	}

	connectedCallback(){
		window.addEventListener("tn-wallet-change", this.walletChangeListener);
	}

	disconnectedCallback(){
		window.removeEventListener("tn-wallet-change", this.walletChangeListener);
	}

	private walletChangeListener = async (e: CustomEvent) => {
		if (e.detail.provider)
			return;

		this.currentTokens = null;
		this.currentTokensFlat = null;
		console.log("Token Grid: TN wallet disconnect");
	};

	async populateTokens(tokens: {[key: string]: IToken} ){

		this.currentTokens = tokens;

		this.currentTokensFlat = Object.keys(this.currentTokens).reduce((tokenArr, contractName) => {

			if (this.currentTokens[contractName].nftDetails){

				// NFTs
				const tokens = this.currentTokens[contractName].nftDetails.map((nft, index) => {
					return {...nft, contextId: contractName + "-" + index};
				});
				tokenArr.push(...tokens);
			} else {
				// fungible token with balance
				const flatToken = {...this.currentTokens[contractName], contextId: contractName};
				tokenArr.push(flatToken);
			}

			return tokenArr;

		}, []);

		this.invokeUrlAction();
	}

	private async invokeUrlAction(){

		const params = new URLSearchParams(document.location.hash.substring(1));

		if (!params.has("card"))
			return;

		const action = params.get("card");

		const cardRes = this.findCardByUrlParam(action);

		if (!cardRes){
			this.showToast('error', "Card not found", "The card '" + action + "' cannot be found.")
			return;
		}

		for (let token of this.currentTokensFlat){

			const context = {
				chainId: ("chainId" in token) ? token.chainId : token.collectionDetails.chainId,
				selectedNftId: ("tokenId" in token) ? token.tokenId : undefined
			}

			if (await cardRes.card.isEnabledOrReason(context) === true) {
				this.showCard(cardRes.card, token, cardRes.index);
				return;
			}
		}

		this.showToast('error', "No supported tokens", "None of your tokens support the " + action + " action.")
	}

	private findCardByUrlParam(id: string){

		const cards = this.tokenScript.getCards();

		for (let [index, card] of cards.entries()){
			if (card.name == id)
				return {card, index};
		}

		const index = parseInt(id);

		if (!isNaN(index) && cards[index])
			return {card: cards[index], index};

		return null;
	}

	private showCard(card: Card, token: TokenGridContext, cardIndex: number){

		const refs = token.contextId.split("-");
		this.tokenScript.setCurrentTokenContext(refs[0], refs.length > 1 ? parseInt(refs[1]): null);
		console.log("Token context set");

		this.tokenScript.showTokenCard(card);

		// TODO: Remove index - all cards should have a unique name but some current tokenscripts don't match the schema
		// TODO: set only card param rather than updating the whole hash query
		document.location.hash = "#card=" + (card.name ?? cardIndex);
	}

	render() {
		return (
			<div class="tokens-grid">
				{
					this.currentTokensFlat?.length ? this.currentTokensFlat.map((token, index) => {
						return (
							<tokens-grid-item tokenScript={this.tokenScript} token={token} showCard={this.showCard}></tokens-grid-item>
						);
					}) :  (<h3>{this.currentTokensFlat ? "You don't have any tokens associated with this TokenScript" : "Connect wallet to load tokens"}</h3>)
				}
			</div>
		)
	}
}

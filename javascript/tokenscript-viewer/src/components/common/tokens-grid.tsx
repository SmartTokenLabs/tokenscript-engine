import {Component, h, JSX, Prop, State, Watch} from "@stencil/core";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {IToken} from "@tokenscript/engine-js/src/tokens/IToken";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {findCardByUrlParam} from "../viewers/util/findCardByUrlParam";
import {getTokensFlat, TokenGridContext} from "../viewers/util/getTokensFlat";
import {Web3WalletProvider} from "../wallet/Web3WalletProvider";

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

	@State()
	loading: boolean = true;

	@Watch("tokenScript")
	async componentDidLoad() {

		await this.populateTokens(await this.tokenScript.getTokenMetadata());

		this.tokenScript.on("TOKENS_UPDATED", (data) => {
			this.populateTokens(data.tokens)
		})

		this.tokenScript.on("TOKENS_LOADING", () => {
			this.loading = true;
			this.currentTokensFlat = null;
			console.log("Tokens loading");
		})
	}

	async populateTokens(tokens: {[key: string]: IToken} ){

		this.loading = false;

		this.currentTokens = tokens;

		this.currentTokensFlat = getTokensFlat(this.currentTokens);

		this.invokeUrlAction();
	}

	private async invokeUrlAction(){

		const params = new URLSearchParams(document.location.hash.substring(1));

		if (!params.has("card"))
			return;

		const action = params.get("card");

		const cardRes = findCardByUrlParam(action, this.tokenScript);

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
			<div>
				<div class="tokens-grid">
					<loading-spinner color="#1A42FF" size="small" style={{display: this.loading ? "block" : "none"}}></loading-spinner>
					{
						this.currentTokensFlat?.length ? this.currentTokensFlat.map((token, index) => {
							return (
								<tokens-grid-item tokenScript={this.tokenScript} token={token} showCard={this.showCard}></tokens-grid-item>
							);
						}) :  (
							!this.loading ? (<h3>{Web3WalletProvider.isWalletConnected() ? "You don't have any tokens associated with this TokenScript" : "Connect wallet to load tokens"}</h3>) : ''
						)
					}
				</div>
			</div>
		)
	}
}
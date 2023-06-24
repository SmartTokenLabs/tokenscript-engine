import {Component, EventEmitter, h, Prop, State, Watch, Event, Host} from "@stencil/core";
import {ITokenIdContext, TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {findCardByUrlParam} from "../../viewers/util/findCardByUrlParam";
import {getTokensFlat, TokenGridContext} from "../../viewers/util/getTokensFlat";
import {Web3WalletProvider} from "../../wallet/Web3WalletProvider";
import {ShowToastEventArgs} from "../../app/app";

@Component({
	tag: 'tokens-grid',
	styleUrl: 'tokens-grid.css',
	shadow: false,
})
export class TokensGrid {

	@Prop() tokenScript: TokenScript;

	currentTokens?: {[key: string]: ITokenCollection};

	@State()
	currentTokensFlat?: TokenGridContext[];

	@State()
	loading: boolean = true;

	@Event({
		eventName: 'showToast',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) showToast: EventEmitter<ShowToastEventArgs>;

	@Watch("tokenScript")
	async componentDidLoad() {

		await this.populateTokens(await this.tokenScript.getTokenMetadata());

		this.tokenScript.on("TOKENS_UPDATED", (data) => {
			this.populateTokens(data.tokens)
		}, "grid")

		this.tokenScript.on("TOKENS_LOADING", () => {
			this.loading = true;
			this.currentTokensFlat = null;
			console.log("Tokens loading");
		}, "grid")
	}

	async populateTokens(tokens: {[key: string]: ITokenCollection} ){

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
			this.showToast.emit({
				type: 'error',
				title: "Card not found",
				description: "The card '" + action + "' cannot be found."
			});
			return;
		}

		for (let token of this.currentTokensFlat){

			const context: ITokenIdContext = {
				chainId: ("chainId" in token) ? token.chainId : token.collectionDetails.chainId,
				selectedTokenId: ("tokenId" in token) ? token.tokenId : undefined
			}

			console.log("Token context: ", context);

			if (await cardRes.card.isEnabledOrReason(context) === true) {
				this.showCard(cardRes.card, token, cardRes.index);
				return;
			}
		}

		this.showToast.emit({
			type: 'error',
			title: "No supported tokens",
			description: "None of your tokens support the " + action + " action."
		});
	}

	private showCard(card: Card, token: TokenGridContext, cardIndex: number){

		const refs = token.contextId.split("-");
		this.tokenScript.setCurrentTokenContext(refs[0], refs.length > 1 ? parseInt(refs[1]): null);
		console.log("Token context set");

		window.scrollTo(0, 0);
		this.tokenScript.showTokenCard(card);

		// TODO: Remove index - all cards should have a unique name but some current tokenscripts don't match the schema
		// TODO: set only card param rather than updating the whole hash query
		document.location.hash = "#card=" + (card.name ?? cardIndex);
	}

	render() {
		return (
			<Host class="tokens-grid">
				<loading-spinner color="#1A42FF" size="small" style={{display: this.loading ? "block" : "none"}}></loading-spinner>
				{
					this.currentTokensFlat?.length ? this.currentTokensFlat.map((token) => {
						return (
							<tokens-grid-item tokenScript={this.tokenScript} token={token} showCard={this.showCard}></tokens-grid-item>
						);
					}) :  (
						!this.loading ? (<h3>{Web3WalletProvider.isWalletConnected() ? "You don't have any tokens associated with this TokenScript" : "Connect wallet to load tokens"}</h3>) : ''
					)
				}
			</Host>
		)
	}
}

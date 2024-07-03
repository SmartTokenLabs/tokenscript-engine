import {Component, EventEmitter, h, Prop, State, Watch, Event, Host, JSX} from "@stencil/core";
import {ITokenIdContext, TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {findCardByUrlParam} from "../../viewers/util/findCardByUrlParam";
import {getTokensFlat, TokenGridContext} from "../../viewers/util/getTokensFlat";
import {WalletConnection, Web3WalletProvider} from "../../wallet/Web3WalletProvider";
import {ShowToastEventArgs} from "../../app/app";

@Component({
	tag: 'tokens-grid',
	styleUrl: 'tokens-grid.css',
	shadow: false,
})
export class TokensGrid {

	@Prop() tokenScript: TokenScript;

	@Prop() showCard: (card: Card, token?: TokenGridContext, cardIndex?: number) => void;

	@Prop() openActionOverflowModal: (buttons: JSX.Element[]) => void;

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


	async componentDidLoad() {
		// TODO: stencil.js seems to copy the tokenscript object by value rather than reference from the new-viewer component,
		//  so we need to register a separate wallet change listener to reload the tokens grid.
		//  This is okay for now but it would be better to solve in a different way, possibly by using stencil events, or implementing a central store for tokenscript instances.
		Web3WalletProvider.registerWalletChangeListener(async (walletConnection?: WalletConnection) => {
			if (!this.tokenScript)
				return;

			if (walletConnection){
				this.tokenScript.getTokenMetadata(true);
			} else {
				this.tokenScript.setTokenMetadata([]);
			}
		});
		await this.initTokenScript();
	}

	@Watch("tokenScript")
	private async initTokenScript(){

		/*if (this.tokenScript.getMetadata().backgroundImageUrl){
			document.getElementsByTagName("body")[0].style.backgroundImage = `url(${tokenScript.getMetadata().backgroundImageUrl})`;
		}*/

		this.tokenScript.on("TOKENS_UPDATED", (data) => {
			this.populateTokens(data.tokens)
		}, "grid")

		this.tokenScript.on("TOKENS_LOADING", () => {
			this.loading = true;
			this.currentTokensFlat = null;
			console.log("Tokens loading");
		}, "grid")

		// TODO: Move to parent component OR ensure parent component is rendered before calling
		setTimeout(async () => {
			await this.populateTokens(await this.tokenScript.getTokenMetadata());
			this.invokeUrlAction();
		}, 500);
	}

	async populateTokens(tokens: {[key: string]: ITokenCollection} ){

		this.loading = false;

		this.currentTokens = tokens;

		this.currentTokensFlat = getTokensFlat(this.currentTokens);
	}

	private async invokeUrlAction(){

		const params = new URLSearchParams(document.location.hash.substring(1));

		if (!params.has("card"))
			return;

		const action = params.get("card");
		const tokenIdParam = params.get("tokenId");

		const cardRes = findCardByUrlParam(action, this.tokenScript);

		if (!cardRes){
			this.showToast.emit({
				type: 'error',
				title: "Card not found",
				description: "The card '" + action + "' cannot be found."
			});
			return;
		}

		if (cardRes.card.type === "onboarding"){
			if (
				await cardRes.card.isEnabledOrReason() === true
			) {
				this.showCard(cardRes.card);
				return;
			}
		}

		for (let token of this.currentTokensFlat){

			const tokenId = ("tokenId" in token) ? token.tokenId : undefined;

			const context: ITokenIdContext = {
				originId: token.originId,
				chainId: ("chainId" in token) ? token.chainId : token.collectionDetails.chainId,
				selectedTokenId: tokenId
			}

			if (
				(!tokenIdParam || tokenIdParam === tokenId.toString()) &&
				cardRes.card.isAvailableForOrigin(token.originId) &&
				await cardRes.card.isEnabledOrReason(context) === true
			) {
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

	render() {
		return (
			<Host class="ts-token-background" style={{backgroundImage: this.tokenScript.getMetadata().backgroundImageUrl ? `url(${this.tokenScript.getMetadata().backgroundImageUrl})` : null}}>
				<div class="bg-blur">
					<div class="tokens-grid">
						<loading-spinner color="#1A42FF" size="small" style={{display: this.loading ? "block" : "none"}}></loading-spinner>
						{
							this.currentTokensFlat?.length ? this.currentTokensFlat.map((token) => {
								return (
									<tokens-grid-item
										key={token.contextId}
										tokenScript={this.tokenScript}
										token={token}
										showCard={this.showCard.bind(this)}
										openActionOverflowModal={this.openActionOverflowModal}></tokens-grid-item>
								);
							}) :  (
								!this.loading ? (<h3>{Web3WalletProvider.isWalletConnected() ? "You don't have any tokens associated with this TokenScript" : "Connect wallet to load tokens"}</h3>) : ''
							)
						}
					</div>
				</div>
			</Host>
		)
	}
}

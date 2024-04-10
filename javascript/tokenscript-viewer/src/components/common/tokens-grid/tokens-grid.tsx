import {Component, EventEmitter, h, Prop, State, Watch, Event, Host, JSX} from "@stencil/core";
import {ITokenIdContext, ITransactionStatus, TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {findCardByUrlParam} from "../../viewers/util/findCardByUrlParam";
import {getTokensFlat, TokenGridContext} from "../../viewers/util/getTokensFlat";
import {Web3WalletProvider} from "../../wallet/Web3WalletProvider";
import {ShowToastEventArgs} from "../../app/app";
import {handleTransactionError, showTransactionNotification} from "../../viewers/util/showTransactionNotification";

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
		await this.initTokenScript();
	}

	@Watch("tokenScript")
	private async initTokenScript(){

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

	private async showCard(card: Card, token: TokenGridContext, cardIndex: number){

		const refs = token.contextId.split("-");
		this.tokenScript.setCurrentTokenContext(refs[0], refs.length > 1 ? parseInt(refs[1]): null);

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
				history.replaceState(undefined, undefined, "#card=" + (card.name ?? cardIndex) + (("tokenId" in token) ? "&tokenId=" + token.tokenId : ''));

		} catch(e){
			console.error(e);
			this.hideLoader.emit();
			handleTransactionError(e, this.showToast);
			return;
		}

		this.hideLoader.emit();
	}

	render() {
		return (
			<Host>
				<div class="tokens-grid">
					<loading-spinner color="#1A42FF" size="small" style={{display: this.loading ? "block" : "none"}}></loading-spinner>
					{
						this.currentTokensFlat?.length ? this.currentTokensFlat.map((token) => {
							return (
								<tokens-grid-item key={token.contextId} tokenScript={this.tokenScript} token={token} showCard={this.showCard.bind(this)}></tokens-grid-item>
							);
						}) :  (
							!this.loading ? (<h3>{Web3WalletProvider.isWalletConnected() ? "You don't have any tokens associated with this TokenScript" : "Connect wallet to load tokens"}</h3>) : ''
						)
					}
				</div>
				<token-info-popover id="token-info-popover" tokenScript={this.tokenScript} />
			</Host>
		)
	}
}

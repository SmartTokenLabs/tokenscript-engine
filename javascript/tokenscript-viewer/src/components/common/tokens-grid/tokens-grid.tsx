import {Component, EventEmitter, h, Prop, State, Watch, Event, Host, JSX} from "@stencil/core";
import {ITokenIdContext} from "@tokenscript/engine-js/src/ITokenScript";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {findCardByUrlParam} from "../../viewers/util/findCardByUrlParam";
import {getTokensFlat, TokenGridContext} from "../../viewers/util/getTokensFlat";
import {WalletConnection, Web3WalletProvider} from "../../wallet/Web3WalletProvider";
import {ShowToastEventArgs} from "../../app/app";
import {ZeroAddress} from "ethers";

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
	notOwnedTokens?: TokenGridContext[];

	@State()
	currentWalletAddress: string = ZeroAddress;

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

	private urlActionInvoked = false;

	async componentDidLoad() {
		// TODO: stencil.js seems to copy the tokenscript object by value rather than reference from the new-viewer component,
		//  so we need to register a separate wallet change listener to reload the tokens grid.
		//  This is okay for now but it would be better to solve in a different way, possibly by using stencil events, or implementing a central store for tokenscript instances.
		Web3WalletProvider.registerWalletChangeListener(async (walletConnection?: WalletConnection) => {
			if (!this.tokenScript)
				return;

			if (walletConnection){
				this.currentWalletAddress = walletConnection.address.toLowerCase();
			} else {
				this.currentWalletAddress = ZeroAddress;
			}
			await this.tokenScript.getTokenMetadata(true);
		});

		if (Web3WalletProvider.isWalletConnected())
			this.currentWalletAddress = (await Web3WalletProvider.getWallet()).address;

		await this.initTokenScript();
	}

	@Watch("tokenScript")
	private async initTokenScript(){

		this.urlActionInvoked = false;
		this.loading = true;
		this.currentTokensFlat = null;
		this.notOwnedTokens = null;

		this.tokenScript.on("TOKENS_UPDATED", async (data) => {
			await this.populateTokens(data.tokens)
			await this.invokeUrlAction();
		}, "grid")

		this.tokenScript.on("TOKENS_LOADING", () => {
			this.loading = true;
			this.currentTokensFlat = null;
			this.notOwnedTokens = null;
			console.log("Tokens loading");
		}, "grid")

		setTimeout(async () => {
			await this.tokenScript.getTokenMetadata(false, false, true);
		}, 20);
	}

	async populateTokens(tokens: {[key: string]: ITokenCollection} ){

		this.loading = false;
		this.currentTokens = {...tokens};

		const flatTokens = getTokensFlat(this.currentTokens);

		this.currentTokensFlat = flatTokens.filter((token) => !("ownerAddress" in token) || token.ownerAddress.toLowerCase() === this.currentWalletAddress.toLowerCase());
		this.notOwnedTokens = flatTokens.filter((token) => "ownerAddress" in token &&  token.ownerAddress.toLowerCase() !== this.currentWalletAddress.toLowerCase());
	}

	private async invokeUrlAction(){

		if (this.urlActionInvoked)
			return;

		const params = new URLSearchParams(document.location.hash.substring(1));

		if (!params.has("card")) {
			this.urlActionInvoked = true;
			return;
		}

		const action = params.get("card");
		const tokenIdParam = params.get("tokenId");

		const cardRes = findCardByUrlParam(action, this.tokenScript);

		if (!cardRes){
			this.showToast.emit({
				type: 'error',
				title: "Card not found",
				description: "The card '" + action + "' cannot be found."
			});
			this.urlActionInvoked = true;
			return;
		}

		if (cardRes.card.type === "onboarding"){
			const reason = await cardRes.card.isEnabledOrReason();
			if (
				reason === true
			) {
				this.urlActionInvoked = true;
				setTimeout(() => this.showCard(cardRes.card), 100);
				return;
			}
			this.showToast.emit({
				type: 'error',
				title: "The card is not available",
				description: "The provided card is not available" + (reason !== false ? ": "+reason : '')
			});
			return;
		}

		if (!this.currentTokensFlat.length && !this.notOwnedTokens.length)
			return;

		for (let token of [...this.currentTokensFlat, ...this.notOwnedTokens]){

			const tokenId = ("tokenId" in token) ? token.tokenId : undefined;

			const context: ITokenIdContext = {
				originId: token.originId,
				chainId: ("chainId" in token) ? token.chainId : token.collectionDetails.chainId,
				selectedTokenId: tokenId
			}

			if (
				(!tokenIdParam || tokenIdParam === tokenId) &&
				cardRes.card.isAvailableForOrigin(token.originId) &&
				await cardRes.card.isEnabledOrReason(context) === true
			) {
				this.urlActionInvoked = true;
				setTimeout(() => this.showCard(cardRes.card, token, cardRes.index), 100);
				return;
			}
		}

		this.showToast.emit({
			type: 'error',
			title: "No supported tokens",
			description: (tokenIdParam ? "The provided token does not" : "None of your tokens") + " support the " + action + " action."
		});
		this.urlActionInvoked = true;
	}

	render() {
		return (
			<Host class="ts-token-background" style={{backgroundImage: this.tokenScript.getMetadata().backgroundImageUrl ? `url(${this.tokenScript.getMetadata().backgroundImageUrl})` : null}}>
				<div class="bg-blur">
					<div class="ts-tokens-grid">
						<loading-spinner color="#1A42FF" size="small" style={{display: this.loading ? "block" : "none"}}></loading-spinner>
						{
							!this.loading && !this.currentTokensFlat?.length && !this.notOwnedTokens?.length ? (
								<h3 class="no-tokens-message">{Web3WalletProvider.isWalletConnected() ?
									"You don't have any tokens associated with this TokenScript" : "Connect wallet to load tokens"}
								</h3>) : ''
						}
					</div>
					{this.currentTokensFlat?.length ?
						([
							(this.notOwnedTokens?.length ? <h4 class="tokens-heading">My tokens</h4> : ''),
							<div class="ts-tokens-grid">
								{
									this.currentTokensFlat.map((token) => {
										return (
											<tokens-grid-item
												key={this.tokenScript.getSourceInfo().tsId + token.contextId}
												tokenScript={this.tokenScript}
												token={token}
												showCard={this.showCard.bind(this)}
												openActionOverflowModal={this.openActionOverflowModal}></tokens-grid-item>
										);
									})
								}
							</div>
						]) : ''
					}
					{this.notOwnedTokens?.length ?
						([
							<h4 class="tokens-heading">Other tokens</h4>,
							<div class="ts-tokens-grid">
								{
									this.notOwnedTokens?.length ? this.notOwnedTokens.map((token) => {
										return (
											<tokens-grid-item
												key={this.tokenScript.getSourceInfo().tsId + token.contextId}
												tokenScript={this.tokenScript}
												token={token}
												showCard={this.showCard.bind(this)}
												openActionOverflowModal={this.openActionOverflowModal}></tokens-grid-item>
										);
									}) : ''
								}
							</div>
						]) : ''
					}
				</div>
			</Host>
		)
	}
}

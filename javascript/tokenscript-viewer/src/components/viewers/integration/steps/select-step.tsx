import {Component, Prop, h, State} from "@stencil/core";
import {IntegrationViewer} from "../integration-viewer";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {IToken} from "@tokenscript/engine-js/src/tokens/IToken";
import {getTokensFlat, TokenGridContext} from "../../util/getTokensFlat";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {WalletConnection, Web3WalletProvider} from "../../../wallet/Web3WalletProvider";

@Component({
	tag: 'select-step',
	styleUrl: 'select-step.css',
	shadow: false,
	scoped: false
})
export class SelectStep {

	@Prop()
	viewer: IntegrationViewer

	@Prop()
	tokenScript: TokenScript

	@Prop()
	card: Card

	currentTokens?: {[key: string]: IToken};

	@State()
	currentTokensFlat?: TokenGridContext[];

	@State()
	tokenButtons: {token: TokenGridContext, enabled: boolean, buttonTitle: string}[];

	constructor() {
		Web3WalletProvider.registerWalletChangeListener(this.handleWalletChange.bind(this));
	}

	handleWalletChange(walletConnection: WalletConnection|undefined){
		if (walletConnection){
			this.tokenScript.getTokenMetadata(true);
		} else {
			this.tokenScript.setTokenMetadata([]);
		}
	}

	async componentWillLoad() {

		await this.populateTokens(await this.tokenScript.getTokenMetadata());

		this.tokenScript.on("TOKENS_UPDATED", (data) => {
			this.populateTokens(data.tokens)
		})

	}

	async populateTokens(tokens: {[key: string]: IToken} ){

		this.viewer.app.showTsLoader();

		this.currentTokens = tokens;

		this.currentTokensFlat = getTokensFlat(this.currentTokens);

		const availableTokens = [];
		this.tokenButtons = [];

		for (let token of this.currentTokensFlat){

			const context = {
				chainId: ("chainId" in token) ? token.chainId : token.collectionDetails.chainId,
				selectedNftId: ("tokenId" in token) ? token.tokenId : undefined
			}

			const enabled = await this.card.isEnabledOrReason(context)

			if (enabled === true) {
				availableTokens.push(token);
			}

			this.tokenButtons.push({
				token: token,
				enabled: enabled === true,
				buttonTitle: enabled !== true ? enabled : this.card.label
			});
		}

		if (availableTokens.length === 0){

			this.viewer.returnResultToRequester({
				action: "ts-callback",
				error: "You do not have any tokens that support this action"
			});

			return;
		}

		if (availableTokens.length === 1){
			const refs = availableTokens[0].contextId.split("-");
			this.tokenScript.setCurrentTokenContext(refs[0], refs.length > 1 ? parseInt(refs[1]): null);
			this.viewer.step = "view";
		}

		this.viewer.app.hideTsLoader();
	}

	render() {
		return (
			<div>
				<wallet-button></wallet-button>
				<div class="select-grid">
					{
						this.tokenButtons ? this.tokenButtons.map((tokenButton) => {
							return (
								<token-button
									token={tokenButton.token}
									enabled={tokenButton.enabled}
									buttonTitle={tokenButton.buttonTitle}
									clickHandler={(token: TokenGridContext) => {

										const refs = token.contextId.split("-");
										this.tokenScript.setCurrentTokenContext(refs[0], refs.length > 1 ? parseInt(refs[1]): null);
										this.viewer.step = "view";

									}}></token-button>
							);
						}) : ''
					}
				</div>
				<div id="tn-integration"></div>
			</div>
		);
	}
}

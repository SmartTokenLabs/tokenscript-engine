import {Component, Prop, h, State} from "@stencil/core";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";

interface TokenOption {
	originId: string,
	tokenId?: string,
	name: string,
	image?: string
}

@Component({
	tag: 'tokens-selector',
	styleUrl: 'tokens-selector.css',
	shadow: false,
	scoped: false
})
export class TokensSelector {

	@Prop()
	tokenScript: TokenScript;

	@Prop()
	switchToken: (TokenOption) => void;

	@State()
	options: TokenOption[] = [];

	@State()
	currentContext = "";

	async componentWillLoad(){
		this.tokenScript.on("TOKENS_UPDATED", () => {
			this.updateOptions();
		}, 'tokens-selector');
		await this.updateOptions()
	}

	private async updateOptions(){

		const options: TokenOption[] = [];
		const tokens = await this.tokenScript.getTokenMetadata();

		for (const origin in tokens){
			if (tokens[origin].tokenType === "erc20"){
				options.push({
					originId: tokens[origin].originId,
					name: tokens[origin].name,
					image: tokens[origin].image
				})
			} else {
				for (const token of tokens[origin].tokenDetails){
					options.push({
						originId: tokens[origin].originId,
						tokenId: token.tokenId,
						name: token.name,
						image: token.image
					})
				}
			}
		}

		this.options = options;

		const context = this.tokenScript.getCurrentTokenContext();

		this.currentContext = context.originId + (context.selectedTokenId ? "-" + context.selectedTokenId : "");
	}

	render() {
		return (
			<select onChange={(e) => {
				const index = (e.target as HTMLSelectElement).selectedIndex;
				this.switchToken(this.options[index])
			}}>
				{ this.options.map((token) => {
					return (
						<option selected={this.currentContext === token.originId + (token.tokenId ? "-" + token.tokenId : "")}>{token.name}</option>
					)
				}) }
			</select>
		)
	}
}

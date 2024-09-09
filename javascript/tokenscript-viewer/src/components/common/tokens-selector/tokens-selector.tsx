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
	isOpen: boolean = false;

	@State()
	currentContext = "";

	async componentWillLoad(){
		this.tokenScript.on("TOKENS_UPDATED", () => {
			this.updateOptions();
		}, 'tokens-selector');
		await this.updateOptions()
	}

	toggleDropdown() {
		this.isOpen = !this.isOpen;
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

		const selectedOption = this.options.find((token) => {
			return this.currentContext === token.originId + (token.tokenId ? "-" + token.tokenId : "")
		})

		return (
			<div class="tokens-selector">
				<div class="selected" style={this.isOpen ? {borderBottomColor: "transparent", borderRadius: "5px 5px 0 0"} : {}} onClick={() => this.toggleDropdown()}>
					{selectedOption ? (
						[
							<span class="icon-container">
								<token-icon src={selectedOption.image} imageTitle={selectedOption.name}/>
							</span>,
							<span class="icon-label">

								{selectedOption.name}
	                        </span>
						]
					) : (
						<span>Select an option</span>
					)}
				</div>
						{
							this.isOpen && (
								<div class="options">
						{this.options.map(option => (
							<div
								class="option"
								onClick={() => {
									this.currentContext = option.originId + (option.tokenId ? "-" + option.tokenId : "");
									this.isOpen = false;
									this.switchToken(option);
								}}
							>
								<span class="icon-container">
									<token-icon src={option.image} imageTitle={option.name}/>
								</span>
								<span>{option.name}</span>
							</div>
						))}
					</div>
				)}
			</div>
	)
	}
}

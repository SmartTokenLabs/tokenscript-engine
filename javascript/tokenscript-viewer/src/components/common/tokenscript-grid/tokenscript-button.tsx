import {Component, h, Prop, State} from "@stencil/core";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {IToken} from "@tokenscript/engine-js/src/tokens/IToken";
import {getTokensFlat} from "../../viewers/util/getTokensFlat";

@Component({
	tag: 'tokenscript-button',
	styleUrl: 'tokenscript-button.css',
	shadow: false,
	scoped: false
})
export class TokenscriptButton {

	@Prop()
	name: string;

	@Prop()
	tokenScript?: TokenScript;

	@State()
	subText: string;

	@Prop()
	imageUrl: string;

	@Prop({mutable: true})
	enabled: boolean = true;

	async connectedCallback(){
		if (!this.tokenScript)
			return;

		this.subText = "loading...";

		const tokens = await this.tokenScript.getTokenMetadata();

		this.updateTokenStatus(tokens);

		this.tokenScript.on("TOKENS_UPDATED", (data) => {
			this.updateTokenStatus(data.tokens);
		});

		this.tokenScript.on("TOKENS_LOADING", () => {
			this.subText = "loading...";
		});
	}

	private updateTokenStatus(tokens: {[id: string]: IToken}){

		const flat = getTokensFlat(tokens);

		this.subText = `${flat.length} Tokens`;
		this.enabled = flat.length > 0;
	}

	render(){
		return (
			<div class={"ts-button" + (this.enabled ? '' : ' disabled')}
				 title={this.name}
				 style={{cursor: this.enabled ? 'pointer' : 'not-allowed'}}>
				<token-icon src={this.imageUrl} imageTitle={this.name}/>
				<div class="ts-details">
					<h5>{this.name}</h5>
					{this.subText ? <span>{this.subText}</span> : ''}
				</div>
			</div>
		);
	}
}

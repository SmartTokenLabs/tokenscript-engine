import {Component, h, Host, Prop, State} from "@stencil/core";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {getTokensFlat} from "../../viewers/util/getTokensFlat";

@Component({
	tag: 'tokenscript-button',
	styleUrl: 'tokenscript-button.css',
	shadow: false,
	scoped: false
})
export class TokenscriptButton {

	@Prop()
	tsId: string;

	@Prop()
	name: string;

	@Prop()
	tokenScript?: TokenScript;

	@State()
	subText: string;

	@Prop({mutable: true})
	selected: boolean = false;

	@Prop()
	imageUrl: string;

	@Prop({mutable: true})
	enabled: boolean = true;

	@Prop()
	onRemove?: (tsId: string) => Promise<void>

	async connectedCallback(){
		if (!this.tokenScript)
			return;

		this.subText = "loading...";

		const tokens = await this.tokenScript.getTokenMetadata();

		this.updateTokenStatus(tokens);

		this.tokenScript.on("TOKENS_UPDATED", (data) => {
			this.updateTokenStatus(data.tokens);
		}, "ts-button");

		this.tokenScript.on("TOKENS_LOADING", () => {
			this.subText = "loading...";
		}, "ts-button");
	}

	private updateTokenStatus(tokens: {[id: string]: ITokenCollection}){

		const flat = getTokensFlat(tokens);

		this.subText = `${flat.length} Tokens`;
		this.enabled = flat.length > 0;
	}

	render(){
		return (
			<Host class={"ts-button" + (this.selected ? ' selected' : '') + (this.enabled && (!this.onRemove || this.tokenScript) ? '' : ' disabled')}
				 title={this.name}
				 style={{cursor: this.enabled && (!this.onRemove || this.tokenScript) ? 'pointer' : 'not-allowed'}}>
				<token-icon src={this.imageUrl} imageTitle={this.name}/>
				<div class="ts-details">
					<h5>{this.name}</h5>
					{this.subText ? <span>{this.subText}</span> : ''}
				</div>
				{this.onRemove ? <button class="remove-btn" onClick={(e) => {
					e.stopPropagation();
					this.onRemove(this.tsId)}
				}>X</button> : ''}
			</Host>
		);
	}
}

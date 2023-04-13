import {Component, Prop, h} from "@stencil/core";
import {TokenGridContext} from "../../../util/getTokensFlat";

@Component({
	tag: 'token-button',
	styleUrl: 'token-button.css',
	shadow: false,
	scoped: false
})
export class TokenButton {

	@Prop()
	token: TokenGridContext;

	@Prop()
	enabled: boolean;

	@Prop()
	buttonTitle: string

	@Prop()
	clickHandler: (token: TokenGridContext) => void;

	componentWillLoad(){

	}

	render(){
		return (
			<div class={"token-button" + (this.enabled? '' : ' disabled')}
				 title={this.buttonTitle}
				 onClick={this.enabled ? () => this.clickHandler(this.token) : null}
				 style={{cursor: this.enabled ? 'pointer' : 'not-allowed'}}>
				<token-icon src={this.token.image} imageTitle={this.token.name}/>
				<div class="token-details">
					<h5>{this.token.name}</h5>
					{
						"tokenId" in this.token && this.token.tokenId ?
							<span title={this.token.tokenId.toString()}>#{this.token.tokenId}</span>
							: ''
					}
				</div>
			</div>
		);
	}
}

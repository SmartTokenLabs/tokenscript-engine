import {Component, h, Prop} from "@stencil/core";

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
	subText: string;

	@Prop()
	imageUrl: string;

	@Prop()
	enabled: boolean = true;

	render(){
		return (
			<div class={"ts-button" + (this.enabled ? '' : ' disabled')}
				 title={this.name}
				 style={{cursor: this.enabled ? 'pointer' : 'not-allowed'}}>
				<token-icon src={this.imageUrl} imageTitle={this.name}/>
				<div class="ts-details">
					<h5>{this.name}</h5>
					<span>{this.subText}</span>
				</div>
			</div>
		);
	}
}

import {Component, h, Prop} from "@stencil/core";

@Component({
	tag: 'input-field',
	styleUrl: 'field.css',
})
export class InputField {

	@Prop()
	name: string;

	@Prop()
	label: string;

	@Prop()
	type: string;

	@Prop({mutable: true})
	value: string;

	render(){
		return (
			<div class="input-container">
				{this.type != "file" ? <label>{this.label}</label> : ''}
				<input name={this.name} type={this.type} />
			</div>
		)
	}
}

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

	@Prop()
	required: boolean = false;

	@Prop()
	pattern?: string;

	@Prop({mutable: true})
	value: any;

	render(){
		return (
			<div class="input-container">
				{this.type != "file" ? <label>{this.label}</label> : ''}
				<input name={this.name} type={this.type} required={this.required} pattern={this.pattern} onChange={(evt: any) => {

					if (this.type === "file")
						this.value = evt.target.files[0];

					this.value = evt.target.value;
				}} />
			</div>
		)
	}
}

import {Component, h, Prop} from "@stencil/core";

@Component({
	tag: 'select-field',
	styleUrl: 'field.css',
})
export class SelectField {

	@Prop()
	name: string;

	@Prop()
	label: string;

	@Prop()
	options: {label: string, value: string}[];

	@Prop({mutable: true})
	value: string;

	render(){
		return (
			<div class="input-container">
				<label>{this.label}</label>
				<select name={this.name}>
				{
					this.options.map((opt) => {
						return <option value={opt.value}>{opt.label}</option>
					})
				}
				</select>
			</div>
		)
	}
}

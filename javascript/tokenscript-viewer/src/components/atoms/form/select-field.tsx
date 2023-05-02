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

	componentWillLoad(){
		if (!this.value && this.options.length > 0)
			this.value = this.options[0].value;
	}

	render(){
		return (
			<div class="input-container">
				<label>{this.label}</label>
				<select name={this.name} onChange={(evt: any) => {
					this.value = evt.target.value;
				}}>
				{
					this.options.map((opt) => {
						return <option value={opt.value} selected={this.value === opt.value}>{opt.label}</option>
					})
				}
				</select>
			</div>
		)
	}
}

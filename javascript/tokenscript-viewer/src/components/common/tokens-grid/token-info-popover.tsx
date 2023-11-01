import {Component, Method, State, h, Prop, Watch} from "@stencil/core";
import {TokenGridContext} from "../../viewers/util/getTokensFlat";
import {TokenScript} from "../../../../../engine-js/src/TokenScript";


@Component({
	tag: 'token-info-popover',
	styleUrl: 'token-info-popover.css',
	shadow: false,
})
export class TokenInfoPopover {

	private dialog: HTMLPopoverDialogElement;

	@State()
	private token: TokenGridContext;

	@State()
	private tsAttributes: {label: string, value: string}[] = [];

	@Prop()
	tokenScript: TokenScript

	@Method()
	async openDialog(token: TokenGridContext){
		this.token = token;

		const [contract, index] = this.token.contextId.split("-");
		this.tokenScript.setCurrentTokenContext(contract, index ? parseInt(index) : null);

		const newAttributes: {label: string, value: string}[] = [];

		for (const attribute of this.tokenScript.getAttributes()){
			const value = await attribute.getCurrentValue();
			if (value)
				newAttributes.push({
					label: attribute.getLabel(),
					value
				});
		}

		this.tsAttributes = newAttributes;

		await this.dialog.openDialog();
	}

	@Method()
	async closeDialog(){
		await this.dialog.closeDialog();
	}

	render(){
		return (
			<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement}>
			{ this.token ?
				<div>
					<h4>{this.token.name}</h4>
					<p>{this.token.description !== this.token.name ? this.token.description : ''}</p>
					{ ("attributes" in this.token && this.token.attributes.length) ?
						<div class="attribute-container">
							{
								this.token.attributes.map((attr) => {

									let value = attr.value;

									switch (attr.display_type){
										case "date":
											const date = new Date(parseInt(value) * 1000);
											value = date.toLocaleDateString() + " " + date.toLocaleTimeString();
											break;
									}

									return (
										<div class="attribute-item">
											<h5>{attr.trait_type}</h5>
											<span>{value}</span>
										</div>
									)
								})
							}
						</div>
					: ''}
					{ this.tsAttributes.length ?
						<div>
							<h4>TokenScript Attributes</h4>
							<div class="attribute-container">
								{
									this.tsAttributes.map(({label, value}) => {

										return (
											<div class="attribute-item">
												<h5>{label}</h5>
												<span>{value.toString()}</span>
											</div>
										)
									})
								}
							</div>
							{/*<table class="token-info-attributes">
								<thead>
								<tr>
									<th>Attribute</th>
									<th>Value</th>
								</tr>
								</thead>
								<tbody>
								{
									this.tsAttributes.map(({label, value}) => {

										return (
											<tr>
												<td>{label}</td>
												<td>{value.toString()}</td>
											</tr>
										)
									})
								}
								</tbody>
							</table>*/}
						</div>
						: ''}
				</div>
			: ''}
			</popover-dialog>
		)
	}
}

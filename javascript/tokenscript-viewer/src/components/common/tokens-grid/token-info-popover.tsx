import {Component, Method, State, h} from "@stencil/core";
import {TokenGridContext} from "../../viewers/util/getTokensFlat";


@Component({
	tag: 'token-info-popover',
	styleUrl: 'token-info-popover.css',
	shadow: false,
})
export class TokenInfoPopover {

	private dialog: HTMLPopoverDialogElement;

	@State()
	private token: TokenGridContext;

	@Method()
	async openDialog(token: TokenGridContext){
		this.token = token;
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
					<p>{this.token.description}</p>
					{ ("attributes" in this.token && this.token.attributes.length) ?
						<table class="token-info-attributes">
							<thead>
								<tr>
									<th>Attribute</th>
									<th>Value</th>
								</tr>
							</thead>
							<tbody>
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
										<tr>
											<td>{attr.trait_type}</td>
											<td>{value}</td>
										</tr>
									)
								})
							}
							</tbody>
						</table>
					: ''}
				</div>
			: ''}
			</popover-dialog>
		)
	}
}

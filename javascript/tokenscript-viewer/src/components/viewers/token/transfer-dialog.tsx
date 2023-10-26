import {Component, h, Method, Prop} from "@stencil/core";
import {TokenScript} from "../../../../../engine-js/src/TokenScript";

@Component({
	tag: 'transfer-dialog',
	styleUrl: 'transfer-dialog.css',
	shadow: false,
	scoped: false
})
export class TransferDialog {

	private dialog: HTMLPopoverDialogElement;

	@Prop()
	tokenScript?: TokenScript;

	@Method()
	async openDialog(){
		await this.dialog.openDialog();
	}

	@Method()
	async closeDialog(){
		await this.dialog.closeDialog();
	}

	render(){
		return (
			<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement} dialogStyles={{maxWidth: "380px"}}>
				<h1>Form goes here!!</h1>
			</popover-dialog>
		)
	}
}

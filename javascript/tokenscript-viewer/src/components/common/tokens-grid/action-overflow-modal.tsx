import {Component, h, Method} from "@stencil/core";

@Component({
	tag: 'action-overflow-modal',
	styleUrl: 'tokens-grid-item.css',
	shadow: false,
	scoped: false
})
export class ActionOverflowModal {

	private dialog: HTMLPopoverDialogElement;

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
			<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement}>
				<slot></slot>
			</popover-dialog>
		)
	}
}

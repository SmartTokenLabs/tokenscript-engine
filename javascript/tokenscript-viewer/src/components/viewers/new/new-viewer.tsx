import {Component, h, Prop, State} from "@stencil/core";
import {AppRoot} from "../../app/app";
import {Web3WalletProvider} from "../../wallet/Web3WalletProvider";

@Component({
	tag: 'new-viewer',
	// styleUrl: 'tabbed-viewer.css',
	shadow: false,
	scoped: false
})
export class NewViewer {

	@Prop()
	app: AppRoot;

	private dialog: HTMLPopoverDialogElement;

	componentWillLoad(){

	}

	render(){
		return (
			<div>
				<h3>New Viewer</h3>
				<button class="btn btn-primary" onClick={() => {
					this.dialog.openDialog();
				}}>Open Popover</button>
				<wallet-button></wallet-button>
				<popover-dialog ref={el => this.dialog = el as HTMLPopoverDialogElement}>
					<h3>Test Dialog Content</h3>
				</popover-dialog>
			</div>
		);
	}

}

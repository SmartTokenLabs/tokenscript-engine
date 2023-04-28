import {Component, h, Method, State} from "@stencil/core";

@Component({
	tag: 'add-selector',
	styleUrl: 'add-selector.css',
	shadow: false,
	scoped: false
})
export class AddSelector {

	private dialog: HTMLPopoverDialogElement;

	@State()
	type?: "contract"|"url"|"file";

	@Method()
	async openTokenScript(){

		this.type = null;

		await this.dialog.openDialog();


	}

	render(){
		return (
			<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement}>
				{ !this.type ? <div>
					<h3>Add Token From</h3>
					<div class="source-container">
						<button class="btn" onClick={() => this.type = "contract"}>Contract Script</button>
						<button class="btn" onClick={() => this.type = "url"}>URL</button>
						<button class="btn" onClick={() => this.type = "file"}>XML File</button>
					</div>
				</div> : ''}
				{ this.type === "contract" ? <div>Contract</div> : ''}
				{ this.type === "url" ? <div>URL</div> : ''}
				{ this.type === "file" ? <div>XML File</div> : ''}
			</popover-dialog>
		);
	}
}

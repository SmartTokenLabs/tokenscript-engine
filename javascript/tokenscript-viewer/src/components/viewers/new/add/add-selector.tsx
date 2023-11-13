import {Component, h, Method, Prop, State} from "@stencil/core";
import {CHAIN_NAME_MAP} from "../../../../integration/constants";
import {TokenScriptSource} from "../../../app/app";

@Component({
	tag: 'add-selector',
	styleUrl: 'add-selector.css',
	shadow: false,
	scoped: false
})
export class AddSelector {

	private dialog: HTMLPopoverDialogElement;

	@Prop()
	onFormSubmit: (type: TokenScriptSource, data: {tsId?: string, xml?: File}) => Promise<void>;

	@State()
	type?: TokenScriptSource;

	@Method()
	async openDialog(){
		this.type = null;
		await this.dialog.openDialog();
	}

	@Method()
	async closeDialog(){
		await this.dialog.closeDialog();
	}

	private async submitForm(){
		const form = document.getElementById("add-form") as HTMLFormElement;

		if (!form.checkValidity())
			return;

		switch (this.type) {
			case "resolve":
				const contract = (document.getElementById("contract-field") as HTMLInputFieldElement).value;
				const chain = parseInt((document.getElementById("chain-field") as HTMLSelectFieldElement).value);
				this.onFormSubmit("resolve", {tsId: chain + "-" + contract});
				break;
			case "url":
				const tsId = (document.getElementById("url-field") as HTMLInputFieldElement).value;
				this.onFormSubmit("url", {tsId});
				break;
			case "file":
				const file = await (document.getElementById("file-field") as HTMLInputFieldElement).getFile();
				this.onFormSubmit("file", {xml: file})
				break;
		}
	}

	private getTypeLabel(){
		return this.type.substring(0, 1).toUpperCase() + this.type.substring(1);
	}

	render(){
		return (
			<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement}>
				<div>
				{
					!this.type ?
						<div>
						<h3>Add Token From</h3>
						<div class="source-container">
							<button class="btn" onClick={() => this.type = "resolve"}>Contract Script</button>
							<button class="btn" onClick={() => this.type = "url"}>URL</button>
							<button class="btn" onClick={() => this.type = "file"}>XML File</button>
						</div>
					</div> : ''
				}
				</div>
				<div>
				{ this.type ?
					<div class="form-view">
						<div class="header">
							<button class="btn" onClick={() => {
								this.type = null;
							}}>&lt;</button>
							<h4>{this.getTypeLabel()}</h4>
						</div>
						<form id="add-form" class="form-container" onSubmit={(e) => { e.preventDefault(); this.submitForm(); }}>
							{this.type === "resolve" ? <div>
								<input-field id="contract-field" name="contract" label="Contract Address" type="text" required={true} pattern="^0x[a-fA-F0-9]{40}$"></input-field>
								<select-field id="chain-field" name="chain" label="Chain"
											  options={Object.entries(CHAIN_NAME_MAP).map((chain) => {
													  return {value: chain[0], label: chain[1]}
												  }
											  )}>
								</select-field>
							</div> : ''}
							{this.type === "url" ? <div>
								<input-field id="url-field" name="url" label="TokenScript URL" type="url" required={true}></input-field>
							</div> : ''}
							{this.type === "file" ? <div>
								<input-field id="file-field" name="file" label="TokenScript XML" type="file" required={true}></input-field>
							</div> : ''}
							<button class="btn btn-primary">Load</button>
						</form>
					</div> : ''
				}
				</div>
			</popover-dialog>
		);
	}
}

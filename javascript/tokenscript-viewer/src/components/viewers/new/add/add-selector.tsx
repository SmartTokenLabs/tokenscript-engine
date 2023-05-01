import {Component, h, Method, State} from "@stencil/core";
import {CHAIN_CONFIG, CHAIN_NAME_MAP} from "../../../../integration/constants";

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

	private formElements: {[key: string]: any} = {};

	@Method()
	async openTokenScript(){

		this.type = null;

		await this.dialog.openDialog();


	}

	private getTypeLabel(){
		return this.type.substring(0, 1).toUpperCase() + this.type.substring(1);
	}

	render(){
		return (
			<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement}>
				{
					!this.type ?
						<div>
						<h3>Add Token From</h3>
						<div class="source-container">
							<button class="btn" onClick={() => this.type = "contract"}>Contract Script</button>
							<button class="btn" onClick={() => this.type = "url"}>URL</button>
							<button class="btn" onClick={() => this.type = "file"}>XML File</button>
						</div>
					</div> : ''
				}
				{ this.type ?
					<div class="form-view">
						<div class="header">
							<button class="btn" onClick={() => {
								this.type = null;
							}}>&lt;</button>
							<h4>{this.getTypeLabel()}</h4>
						</div>
						<div class="form-container">
							{this.type === "contract" ? <div>
								<form>
									<input-field name="contract" label="Contract Address" type="text"></input-field>
									<select-field name="chain" label="Chain"
												  options={Object.entries(CHAIN_NAME_MAP).map((chain) => {
														  return {value: chain[0], label: chain[1]}
													  }
												  )}>
									</select-field>
								</form>
							</div> : ''}
							{this.type === "url" ? <div>
								<form>
									<input-field name="url" label="TokenScript URL" type="text"></input-field>
								</form>
							</div> : ''}
							{this.type === "file" ? <div>
								<form>
									<input-field name="file" label="TokenScript XML" type="file"></input-field>
								</form>
							</div> : ''}
							<button class="btn btn-primary">Load</button>
						</div>
					</div> : ''
				}
			</popover-dialog>
		);
	}
}

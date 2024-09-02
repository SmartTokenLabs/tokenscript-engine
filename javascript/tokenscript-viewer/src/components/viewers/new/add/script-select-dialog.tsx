import {Component, h, Host, Method, Prop, State} from "@stencil/core";
import {ScriptInfo} from "@tokenscript/engine-js/src/repo/sources/SourceInterface";

@Component({
	tag: 'script-select-dialog',
	styleUrl: 'script-select-dialog.css',
	shadow: false,
})
export class ScriptSelectDialog {

	private dialog: HTMLPopoverDialogElement;

	@Prop() onScriptSelect: (scriptInfo: ScriptInfo) => void

	@State() scripts: ScriptInfo[] = [];

	@Method()
	async open(scripts: ScriptInfo[]){
		this.scripts = scripts;
		await this.dialog.openDialog();
	}

	render() {

		let scriptData = this.scripts;
		let buttons = [];

		// TODO: Add this same component on viewer-popover too
		// Which is currently selected?
		//let currentSelection = this.tokenScript.getSourceInfo().scriptInfo?.scriptId;
		let currentSelection;

		//populate with script data
		for (let i = 0; i < scriptData?.length; i++) {
			let script = scriptData[i];
			buttons.push({
				icon: script.icon?.length > 0 ? script.icon : "assets/icon/blueTS.svg",
				name: script.name,
				selected: scriptData[i].scriptId == currentSelection ? "assets/icon/circlecr.png" : "assets/icon/uncel2s.png"
			});
		}

		return (
			<Host>
				<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement} dialogStyles={{ background: "#fff !important", color: "#000 !important" }}>
					<p>Select from the available TApps below</p>
					<div class="select-list">
						{this.scripts.map((script, index) => {
							return <tokenscript-button
								name={script.name}
								imageUrl={script.icon}
								onClick={() => {
									this.onScriptSelect(this.scripts[index]);
									this.dialog.closeDialog();
								}}>
							</tokenscript-button>
						})}
					</div>
				</popover-dialog>
			</Host>
		)
	}
}

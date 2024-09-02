import {Component, h, Host, Method, Prop, State} from "@stencil/core";
import {ScriptInfo} from "@tokenscript/engine-js/src/repo/sources/SourceInterface";

@Component({
	tag: 'script-select-dialog',
	styleUrl: 'script-select-dialog.css',
	shadow: true,
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

	/*private selectScript(val: number) {
		//redirect to load the correct log

		let selectionJSON = this.tokenScript.getSourceInfo().scriptData;
		//populate with appropriate data
		for (let i = 0; i < selectionJSON.length; i++) {
			if (selectionJSON[i].order == val) {
				//update URL and reload
				this.setURLLookup(selectionJSON[i].sourceUrl, selectionJSON[i].tokenId);
				break;
			}
		}
	}

	private async setURLLookup(registryURL: string, tokenId: number) {
		const params = new URLSearchParams(document.location.search);

		params.delete("tsId");
		params.delete("tokenscriptUrl");

		params.set("registryScriptUrl", registryURL);
		params.set("registryTokenId", tokenId.toString());

		const location = new URL(document.location.href);
		location.search = params.toString();

		// Update the browser's history state
		history.pushState(undefined, undefined, location.toString());

		await new Promise((resolve) => setTimeout(resolve, 500));

		// Reload the page with the new URL using either method
		window.location.assign(location.toString());
	}*/

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
					<div>
						{buttons.map((button, index) => (
							<div><button
								key={button.id}
								onClick={() => {
									this.onScriptSelect(this.scripts[index]);
									this.dialog.closeDialog();
								}}
								class="button-fixed-width"
								style={{ marginTop: '10px', cursor: 'pointer' }}
							>
								<div class="button-content">
									<img src={button.icon} class={"icon-small"} />
									{button.name}
								</div>
								<img src={button.selected} class={"selector-small"} />
							</button><br /></div>
						))}
					</div>
				</popover-dialog>
			</Host>
		)
	}
}

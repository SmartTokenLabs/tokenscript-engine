import { Component, h, Host, Prop, State, Watch } from "@stencil/core";
import { ISecurityInfo, SecurityStatus as TSSecurityStatus } from "@tokenscript/engine-js/src/security/SecurityInfo";
import { TokenScript } from "@tokenscript/engine-js/src/TokenScript";
import { computeAddress } from "ethers";

@Component({
	tag: 'security-status',
	styleUrl: 'security-status.css',
	shadow: true,
})
export class SecurityStatus {

	private dialog: HTMLPopoverDialogElement;

	@Prop() tokenScript: TokenScript;

	@Prop() size: "large" | "small" | "x-small" = "large";

	@State() securityInfo: Partial<ISecurityInfo>;

	@State() statusColor: string;
	@State() statusIcon: string;

	async componentWillLoad() {
		this.securityInfo = await this.tokenScript.getSecurityInfo().getInfo()
	}

	@Watch("securityInfo")
	private updateStatusState() {
		switch (this.securityInfo.status) {
			case TSSecurityStatus.VALID:
				this.statusColor = "#3bd23b";
				this.statusIcon = "✔";
				break;
			case TSSecurityStatus.WARNING:
				this.statusColor = "#ff871d";
				this.statusIcon = "✗";
				break;
			case TSSecurityStatus.INVALID:
				this.statusColor = "#ff4f4f";
				this.statusIcon = "✗";
				break;
		}
	}

	private getDetailedSecurityInfo() {

		const authMethods = this.securityInfo.originStatuses.reduce((previous, originStatus) => {

			// TODO: Map to label values

			if (previous.indexOf(originStatus.type) === -1)
				previous.push(originStatus.type);
			return previous;
		}, []);

		return "TokenScript security information\n" +
			(this.securityInfo.trustedKey ? "\nIssued by: " + this.securityInfo.trustedKey.issuerName + "\n2" : "") +
			(this.securityInfo.authoritivePublicKey ? "\nAuthoritative Key: " + computeAddress(this.securityInfo.authoritivePublicKey) + "\n(" + this.securityInfo.authoritivePublicKey + ")" : "") +
			(this.securityInfo.signerPublicKey ? "\nSigner Key: " + computeAddress(this.securityInfo.signerPublicKey) : "") +
			"\nAuthentication: " + (authMethods.join(", "));
	}


	private selectScript(val: number) {
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

	private setURLLookup(registryURL: string, tokenId: number) {
		const params = new URLSearchParams(document.location.search);

		params.delete("tsId");
		params.delete("tokenscriptUrl");

		params.set("registryScriptUrl", registryURL);
		params.set("registryTokenId", tokenId.toString());

		const location = new URL(document.location.href);
		location.search = params.toString();

		// Update the browser's history state
		history.pushState(undefined, undefined, location.toString());

		// Reload the page with the new URL using either method
		window.location.assign(location.toString());
	}

	render() {

		let scriptData = this.tokenScript.getSourceInfo().scriptData;
		let buttons = [];

		// Which is currently selected?
		let currentSelection = this.tokenScript.getSourceInfo().selectionId;

		//populate with script data
		for (let i = 0; i < scriptData.length; i++) {
			let thisSelection = scriptData[i];
			buttons.push({
				id: thisSelection.order,
				icon: thisSelection.icon.length > 0 ? thisSelection.icon : "assets/icon/blueTS.svg",
				name: thisSelection.name,
				selected: scriptData[i].tokenId == currentSelection ? "assets/icon/circlecr.png" : "assets/icon/uncel2s.png"
			});
		}

		return (
			this.securityInfo ?
				<Host>
					<div class={"security-status " + this.size} style={{ background: this.statusColor }}
						title={this.securityInfo.statusText + "\n\n" + this.getDetailedSecurityInfo()}
						onClick={() => this.dialog.openDialog()}>
						{this.statusIcon}
					</div>
					<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement} dialogStyles={{ background: "#fff !important", color: "#000 !important" }}>
						<h1 class="security-popover-icon" style={{ color: this.statusColor }}>{this.statusIcon}</h1>
						<strong>{this.securityInfo.statusText}</strong>
						<p style={{ wordWrap: "break-word" }} innerHTML={this.getDetailedSecurityInfo().replaceAll("\n", "<br/>")}>
						</p>
						<div>
							{buttons.map((button) => (
								<div><button
									key={button.id}
									onClick={() => this.selectScript(button.id)}
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
				: ''
		)
	}
}

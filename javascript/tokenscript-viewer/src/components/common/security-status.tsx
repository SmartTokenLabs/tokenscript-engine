import {Component, h, Host, Prop, State, Watch} from "@stencil/core";
import {ISecurityInfo, SecurityStatus as TSSecurityStatus} from "@tokenscript/engine-js/src/security/SecurityInfo";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {computeAddress} from "ethers";

@Component({
	tag: 'security-status',
	styleUrl: 'security-status.css',
	shadow: true,
})
export class SecurityStatus {

	private dialog: HTMLPopoverDialogElement;

	@Prop() tokenScript: TokenScript;

	@Prop() size: "large"|"small" = "large";

	@State() securityInfo: Partial<ISecurityInfo>;

	@State() statusColor: string;
	@State() statusIcon: string;

	async componentWillLoad() {
		this.securityInfo = await this.tokenScript.getSecurityInfo().getInfo()
	}

	@Watch("securityInfo")
	private updateStatusState(){
		switch (this.securityInfo.status){
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

	private getDetailedSecurityInfo(){

		const authMethods = this.securityInfo.originStatuses.reduce((previous, originStatus) => {

			// TODO: Map to label values

			if (previous.indexOf(originStatus.type) === -1)
				previous.push(originStatus.type);
			return previous;
		}, []);

		return "TokenScript security information\n" +
			(this.securityInfo.trustedKey ? "\nIssued by: " + this.securityInfo.trustedKey.issuerName + "\n" : "") +
			(this.securityInfo.authoritivePublicKey ? "\nAuthoritative Key: " + computeAddress(this.securityInfo.authoritivePublicKey) + "\n(" + this.securityInfo.authoritivePublicKey + ")" : "") +
			(this.securityInfo.signerPublicKey ? "\nSigner Key: " + computeAddress(this.securityInfo.signerPublicKey) : "") +
			"\nAuthentication: " + (authMethods.join(", "));
	}

	render() {
		return (
			this.securityInfo ?
				<Host>
					<div class={"security-status" + (this.size === "small" ? " small" : "")} style={{background: this.statusColor}}
						 title={this.securityInfo.statusText + "\n\n" + this.getDetailedSecurityInfo()}
						 onClick={() => this.dialog.openDialog()}>
						{this.statusIcon}
					</div>
					<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement}>
						<h1 class="security-popover-icon" style={{color: this.statusColor}}>{this.statusIcon}</h1>
						<strong>{this.securityInfo.statusText}</strong>
						<p style={{wordWrap: "break-word"}} innerHTML={this.getDetailedSecurityInfo().replaceAll("\n", "<br/>")}>
						</p>
					</popover-dialog>
				</Host>
			: ''
		)
	}
}

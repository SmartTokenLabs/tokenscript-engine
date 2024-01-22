import {Component, h, Host, Prop, State, Watch} from "@stencil/core";
import {SecurityStatus as TSSecurityStatus} from "@tokenscript/engine-js/src/security/SecurityInfo";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {IOriginSecurityInfo} from "@tokenscript/engine-js/src/tokenScript/Origin";

@Component({
	tag: 'token-security-status',
	styleUrl: 'token-security-status.css',
	shadow: true,
})
export class TokenSecurityStatus {

	private dialog: HTMLPopoverDialogElement;

	@Prop() tokenScript: TokenScript;
	@Prop() originId: string;

	@State() securityInfo: Partial<IOriginSecurityInfo>;

	@State() statusColor: string;
	@State() statusIcon: string;

	async componentWillLoad() {
		this.securityInfo = await this.tokenScript.getSecurityInfo().getOriginInfo(this.originId);
	}

	@Watch("securityInfo")
	private updateStatusState(){

		switch (this.securityInfo?.status){
			case TSSecurityStatus.VALID:
				this.statusColor = "#3bd23b";
				this.statusIcon = "✔";
				break;
			case TSSecurityStatus.INVALID:
			default:
				this.statusColor = "#ff4f4f";
				this.statusIcon = "✗";
				break;
		}
	}

	private getDetailedSecurityInfo(){
		return (this.securityInfo.trustedKey ? "Issued by: " + this.securityInfo.trustedKey.issuerName + "\n\n" + "Signer key: " + this.securityInfo.trustedKey.value : "") +
		(this.securityInfo.signingKey ? "Signer Key: " + this.securityInfo.signingKey : "");
	}

	render() {
		return (
			this.securityInfo ?
				<Host>
					<div class="token-security-status" style={{background: this.statusColor}}
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

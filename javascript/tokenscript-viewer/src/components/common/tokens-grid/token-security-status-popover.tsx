import {Component, h, Host, Method, State, Watch} from "@stencil/core";
import {SecurityStatus as TSSecurityStatus} from "@tokenscript/engine-js/src/security/SecurityInfo";
import {IOriginSecurityInfo} from "@tokenscript/engine-js/src/tokenScript/Origin";

@Component({
	tag: 'token-security-status-popover',
	shadow: false,
})
export class TokenSecurityStatus {

	private dialog: HTMLPopoverDialogElement;

	@State() securityInfo: Partial<IOriginSecurityInfo>;

	@State() statusColor: string;
	@State() statusIcon: string;

	@Method()
	async openDialog(tokenSecInfo: Partial<IOriginSecurityInfo>){
		this.securityInfo = tokenSecInfo;
		this.dialog.openDialog();
	}

	@Watch("securityInfo")
	private updateStatusState(){

		switch (this.securityInfo?.status){
			case TSSecurityStatus.VALID:
				this.statusColor = "#3bd23b";
				this.statusIcon = "✔";
				break;
			case TSSecurityStatus.WARNING:
				this.statusColor = "#ff871d";
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
			<Host>
				<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement} dialogStyles={{background: "#fff !important", color: "#000 !important"}}>
					{(this.securityInfo ?
						<div>
							<h1 class="security-popover-icon"
							    style={{color: this.statusColor}}>{this.statusIcon}</h1>
							<strong innerHTML={this.securityInfo.statusText.replaceAll("\n", "<br/>")}/>
							<p style={{wordWrap: "break-word"}} innerHTML={this.getDetailedSecurityInfo().replaceAll("\n", "<br/>")}></p>
						</div>
				 : '')}
				</popover-dialog>
			</Host>
		)
	}
}

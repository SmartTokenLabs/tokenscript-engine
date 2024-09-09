import {Component, h, Host, Prop, State, Watch} from "@stencil/core";
import {SecurityStatus as TSSecurityStatus} from "@tokenscript/engine-js/src/security/SecurityInfo";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {IOriginSecurityInfo} from "@tokenscript/engine-js/src/tokenScript/Origin";

@Component({
	tag: 'token-security-status',
	styleUrl: 'token-security-status.css',
	shadow: false,
})
export class TokenSecurityStatus {

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

	private openPopover(){
		(document.getElementById("token-security-status-popover") as HTMLTokenSecurityStatusPopoverElement).openDialog(this.securityInfo);
	}

	render() {
		return (
			this.securityInfo ?
				<Host>
					<div class="token-security-status" style={{background: this.statusColor}}
						 title={this.securityInfo.statusText + "\n\n" + this.getDetailedSecurityInfo()}
						 onClick={() => this.openPopover()}>
						{this.statusIcon}
					</div>
				</Host>
				: ''
		)
	}
}

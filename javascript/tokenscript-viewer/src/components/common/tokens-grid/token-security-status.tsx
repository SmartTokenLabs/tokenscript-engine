import {Component, h, Prop, State} from "@stencil/core";
import {ISecurityInfo, SecurityStatus as TSSecurityStatus} from "@tokenscript/engine-js/src/security/SecurityInfo";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {IOriginSecurityInfo, Origin} from "@tokenscript/engine-js/src/tokenScript/Origin";

@Component({
	tag: 'token-security-status',
	styleUrl: 'token-security-status.css',
	shadow: true,
})
export class TokenSecurityStatus {

	@Prop() tokenScript: TokenScript;
	@Prop() originId: string;

	@State() securityInfo: Partial<IOriginSecurityInfo>;

	@State() statusColor: string;
	@State() statusIcon: string;

	async componentDidLoad() {
		this.securityInfo = await this.tokenScript.getSecurityInfo().getOriginInfo(this.originId);
		this.updateStatusState();
	}

	private updateStatusState(){
		switch (this.securityInfo.status){
			case TSSecurityStatus.VALID:
				this.statusColor = "#3bd23b";
				this.statusIcon = "✔";
				break;
			case TSSecurityStatus.INVALID:
			default:
				this.statusColor = "#ff4f4f";
				this.statusIcon = "⚠";
				break;
		}
	}

	private getDetailedSecurityInfo(){
		return this.securityInfo.statusText;
	}

	render() {
		return (
			this.securityInfo ?
				<div class="token-security-status" style={{background: this.statusColor}}
					 title={this.getDetailedSecurityInfo()}>
					{this.statusIcon}
				</div>
				: ''
		)
	}
}

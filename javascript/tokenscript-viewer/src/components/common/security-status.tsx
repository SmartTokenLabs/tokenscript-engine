import {Component, Element, h, Prop, State, Watch} from "@stencil/core";
import {ISecurityInfo, SecurityStatus as TSSecurityStatus} from "@tokenscript/engine-js/src/security/SecurityInfo";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";

@Component({
	tag: 'security-status',
	styleUrl: 'security-status.css',
	shadow: true,
})
export class SecurityStatus {

	@Prop() tokenScript: TokenScript;

	@State() securityInfo: Partial<ISecurityInfo>;

	@State() statusColor: string;
	@State() statusIcon: string;

	async componentDidLoad() {
		this.securityInfo = await this.tokenScript.getSecurityInfo();
		this.updateStatusState();
		console.log("Security status loaded!");
	}

	private updateStatusState(){
		switch (this.securityInfo.status){
			case TSSecurityStatus.VALID:
				this.statusColor = "#3bd23b";
				this.statusIcon = "✔";
				break;
			case TSSecurityStatus.WARNING:
				this.statusColor = "#ff871d";
				this.statusIcon = "⚠";
				break;
			case TSSecurityStatus.INVALID:
				this.statusColor = "#ff4f4f";
				this.statusIcon = "⚠";
				break;
		}
	}

	render() {
		return (
			this.securityInfo ?
				<div class="security-status" style={{background: this.statusColor}}
					title={this.securityInfo.statusText + "\n\n" +
						"TokenScript security information\n\n" +
						"Integrity: " + this.securityInfo.integrityText + "\n" +
						"Authentication: " + (this.securityInfo.authText ?? "N/A")}>
					{this.statusIcon}
				</div>
			: ''
		)
	}
}

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

	async componentDidLoad() {
		this.securityInfo = await this.tokenScript.getSecurityInfo();
		console.log("Security status loaded!");
	}

	private getStatusColor(){
		switch (this.securityInfo.status){
			case TSSecurityStatus.VALID:
				return "green";
			case TSSecurityStatus.WARNING:
				return "orange";
			case TSSecurityStatus.INVALID:
				return "red";
		}
	}

	render() {
		return (
			this.securityInfo ?
				<div class="security-status" style={{background: this.getStatusColor()}}
					title={"TokenScript security information\n\n" +
						"Integrity: " + this.securityInfo.integrityText + "\n" +
						"Authentication: " + (this.securityInfo.authText ?? "N/A")}>
					{this.securityInfo.statusText}
				</div>
			: ''
		)
	}
}

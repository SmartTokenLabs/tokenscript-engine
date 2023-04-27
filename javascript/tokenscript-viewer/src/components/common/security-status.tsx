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
				return "#3bd23b";
			case TSSecurityStatus.WARNING:
				return "#ff871d";
			case TSSecurityStatus.INVALID:
				return "#ff4f4f";
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

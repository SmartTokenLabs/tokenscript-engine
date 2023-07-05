import {Component, h, Prop, State} from "@stencil/core";
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
		this.securityInfo = await this.tokenScript.getSecurityInfo().getInfo()
		this.updateStatusState();
		console.log("Security status loaded!", this.securityInfo);
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

	private getDetailedSecurityInfo(){

		console.log(this.securityInfo.originStatuses);

		const authMethods = this.securityInfo.originStatuses.reduce((previous, originStatus) => {

			// TODO: Map to label values

			if (previous.indexOf(originStatus.type) === -1)
				previous.push(originStatus.type);
			return previous;
		}, []);

		return "TokenScript security information\n\n" +
			(this.securityInfo.signerPublicKey ? "Signer Key: " + this.securityInfo.signerPublicKey + "\n" : "") +
			"Authentication: " + (authMethods.join(", "));
	}

	render() {
		return (
			this.securityInfo ?
				<div class="security-status" style={{background: this.statusColor}}
					title={this.securityInfo.statusText + "\n\n" +
						this.getDetailedSecurityInfo()}>
					{this.statusIcon}
				</div>
			: ''
		)
	}
}

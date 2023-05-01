import {ScriptSourceType} from "../Engine";
import {TokenScript} from "../TokenScript";
import {DSigValidator} from "./validator/DSigValidator";
import {IpfsCidValidator} from "./validator/IpfsCidValidator";

export enum IntegrityType {
	NONE = "none",
	URL_HASH = "urlHash", // The URL that is provided by ScriptUri contract method has a SHA256 hash
	XML_DSIG = "dsig",
}

export enum AuthenticationType {
	NONE = "none",
	SCRIPT_URI = "scriptUri", // The script has been loaded from a URL specified by the ScriptUri smart contract function.
	XML_DSIG = "dsig", // The XML dsig is an EC signature, signed by the origin smart contract deployer
}

export enum SecurityStatus {
	VALID = "valid",
	WARNING = "warn",
	INVALID = "invalid"
}

export interface ISecurityInfo {
	sourceUrl: string,
	auth: AuthenticationType,
	authText: string,
	integrity: IntegrityType,
	integrityText: string,
	status: SecurityStatus,
	statusText: string,
}

/**
 * SecurityInfo is used to determine authenticity and integrity of TokenScript files, and then makes those details
 * available to the user-agent in uniform format.
 * The user-agent can then implement their own functionality for showing validity in the UI.
 */
export class SecurityInfo {

	private securityInfo?: Partial<ISecurityInfo>;

	constructor(
		private tokenScript: TokenScript,
		private xml: XMLDocument,
		private xmlStr: string,
		private source: ScriptSourceType,
		private sourceUrl: string
	) {

	}

	/**
	 * Verify the TokenScript file and return validity data
	 */
	public async getInfo(){

		if (!this.securityInfo){

			await this.verify();

			if (!this.securityInfo.statusText){
				if (this.securityInfo.status === SecurityStatus.VALID){
					this.securityInfo.statusText = "TokenScript authenticity & integrity successfully validated";
				} else {
					this.securityInfo.statusText = "TokenScript authenticity and integrity cannot be established";
				}
			}

			console.log("TokenScript security info result: ", this.securityInfo);
		}

		return this.securityInfo;
	}

	/**
	 * Verify the file using various IScriptValidator implementations
	 * @private
	 */
	private async verify(){

		const dsigResult = await new DSigValidator().validate(this.tokenScript, this.sourceUrl, this.xmlStr);

		if (dsigResult !== false){
			this.securityInfo = dsigResult;
			return;
		}

		if (this.source === ScriptSourceType.SCRIPT_URI) {
			const ipfsResult = await new IpfsCidValidator().validate(this.tokenScript, this.sourceUrl, this.xmlStr)

			if (ipfsResult !== false){
				this.securityInfo = ipfsResult;
				return;
			}
		}

		this.securityInfo = {};
		this.securityInfo.status = SecurityStatus.INVALID;
		this.securityInfo.auth = AuthenticationType.NONE;
		this.securityInfo.authText = "Could not verify contract/script authenticity";
		this.securityInfo.integrity = IntegrityType.NONE;
		this.securityInfo.integrityText = "Could not validated TokenScript file integrity";
	}

}

import {ScriptSourceType} from "../Engine";
import {TokenScript} from "../TokenScript";
import {DSigValidator} from "./DSigValidator";
import * as IPFSOnlyHash from 'ipfs-only-hash';
import {IOriginSecurityInfo} from "../tokenScript/Origin";

export enum SecurityStatus {
	VALID = "valid",
	WARNING = "warn",
	INVALID = "invalid"
}

export interface ISecurityInfo {
	signerPublicKey?: string,
	ipfsCid?: string,
	status: SecurityStatus,
	statusText: string,
	signerInfo: string // TODO: This is where we can put details of a known signer
	originStatuses: IOriginSecurityInfo[]
}

/**
 * SecurityInfo is used to determine authenticity and integrity of TokenScript files, and then makes those details
 * available to the user-agent in uniform format.
 * The user-agent can then implement their own functionality for showing validity in the UI.
 */
export class SecurityInfo {

	private securityInfo?: Partial<ISecurityInfo>;
	private originStatuses: {[name: string]: IOriginSecurityInfo} = {};

	// TODO: Implement root key resolution from EAS keychain contract
	//private signerRootKey?: string

	constructor(
		private tokenScript: TokenScript,
		private xml: XMLDocument,
		private xmlStr: string,
		private source: ScriptSourceType,
		private sourceUrl: string
	) {

	}

	/**
	 * Populate the top level security info for the TokenScript.
	 * This includes the XML public key and the IPFS CID
	 */
	private async loadTokenScriptKeyInfo(){

		this.securityInfo = {};

		const result = await new DSigValidator().getSignerKey(this.tokenScript);

		if (result !== false){
			this.securityInfo.signerPublicKey = result;
		}

		this.securityInfo.ipfsCid = await IPFSOnlyHash.of(this.xmlStr, null);

		await this.verifyOrigins();
	}

	private async verifyOrigins(){

		this.securityInfo.originStatuses = [];

		const origins = this.tokenScript.getOrigins();
		let originFailCount = 0;

		for (const name in origins){
			const origin = origins[name];
			const originStatus = await origin.getOriginSecurityStatus(this.securityInfo);

			if (originStatus.status === SecurityStatus.INVALID)
				originFailCount++;

			this.securityInfo.originStatuses.push(originStatus);
			this.originStatuses[name] = originStatus;
		}

		if (originFailCount === 0){
			this.securityInfo.status = SecurityStatus.VALID;
			this.securityInfo.statusText = "The TokenScript is authenticated for use with all specified token origins.";
		} else {
			this.securityInfo.status = SecurityStatus.INVALID;

			// Some origins are linked
			if (originFailCount < Object.values(origins).length){
				this.securityInfo.statusText = "The TokenScript is not authenticated for some token origins. \nTake care when signing transactions for these tokens.";
			} else {
				// No origins are linked
				this.securityInfo.statusText = "The TokenScript is not authenticated for any listed token origins. \nSign any transactions with caution.";
			}
		}
	}

	/**
	 * Verify the TokenScript file and return validity data
	 */
	public async getInfo(){

		if (!this.securityInfo){
			await this.loadTokenScriptKeyInfo();
		}

		return this.securityInfo;
	}

	/**
	 *
	 * @param originId
	 */
	public async getOriginInfo(originId: string){

		// TODO: Track valid public keys and contract sources in originInfo and compare to individual NFT or attestation issuer

		if (!this.securityInfo){
			await this.loadTokenScriptKeyInfo();
		}

		return this.originStatuses[originId];
	}

}

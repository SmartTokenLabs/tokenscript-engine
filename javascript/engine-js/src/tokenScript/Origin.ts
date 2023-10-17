import {TokenScript} from "../TokenScript";
import {ISecurityInfo, SecurityStatus} from "../security/SecurityInfo";
import {ContractKeyResolver} from "../security/ContractKeyResolver";
import {ethers} from "ethers";

export type OriginType = "contract"|"attestation"

export enum AuthenticationType {
	NONE = "none",
	IPFS_CID = "ipfsCid", // The script has been loaded from a URL specified by the ScriptUri smart contract function.
	XML_DSIG = "dsig", // The XML dsig is an EC signature, signed by the origin smart contract deployer
}

export interface IOriginSecurityInfo {
	type: AuthenticationType
	status: SecurityStatus,
	statusText: string
}

export class Origin {

	private securityStatus?: IOriginSecurityInfo

	constructor(
		private tokenScript: TokenScript,
		public name: string,
		public type: OriginType
	) {

	}

	public async getOriginSecurityStatus(securityInfo: Partial<ISecurityInfo>){

		if (!this.securityStatus){

			console.log("Validating token origin: " + this.name);

			if (securityInfo.signerPublicKey)
				await this.validateBySignerKey(securityInfo.signerPublicKey);

			if (!this.securityStatus && this.type === "contract")
				await this.validateByContractScriptUri(securityInfo.ipfsCid);

			if (!this.securityStatus)
				this.securityStatus = {
					type: AuthenticationType.NONE,
					status: SecurityStatus.INVALID,
					statusText: "The TokenScript is not signed by the " + (this.type == "attestation" ? "attestation issuer" : "contract deployer")
				}
		}

		return this.securityStatus;
	}

	private async validateBySignerKey(publicKeyHex: string){

		if (this.type === "contract"){
			// Resolve contract owner or deployer address
			const contract = this.tokenScript.getContractByName(this.name);

			try {
				// TODO: Handle per address/chain statuses when tokens are loaded
				const contractKey = await (new ContractKeyResolver(this.tokenScript).resolvePublicKey(contract));

				// transform tokenscript signing key into address if required
				const dsigKeyOrAddress = contractKey.valueType === "ethAddress" ? ethers.utils.computeAddress(publicKeyHex) : publicKeyHex;

				console.log("DSIG validator: revolved contract deployment key: ", contractKey);

				if (dsigKeyOrAddress.toLowerCase() === contractKey.value.toLowerCase()) {
					this.securityStatus = {
						type: AuthenticationType.XML_DSIG,
						status: SecurityStatus.VALID,
						statusText: "The TokenScript signer matches the contract deployer for this token"
					}

					console.log("DSIG validator: DSIG matched successfully");
				} else {
					console.warn("DSIG validator: contract key does not match DSIG: ", dsigKeyOrAddress);
				}

			} catch (e) {
				console.warn(e);
			}

		} else {
			// Match against attestation definition public key
			const definition = this.tokenScript.getAttestationDefinitions().getDefinition(this.name);

			// TODO: This will cause valid attestations to be marked as a fail, rework so status for a specific token can be fetched
			for (const key of definition.keys){
				console.log("DSIG Validator: matching attestation issuer key: ", key);
				if (publicKeyHex.replace("0x", "").toLowerCase() !== key.replace("0x", "").toLowerCase()) {
					console.warn("DSIG Validator: attestation issuer key does not match DSIG: ", publicKeyHex);
					return; // Does not match one key
				}
			}

			this.securityStatus = {
				type: AuthenticationType.XML_DSIG,
				status: SecurityStatus.VALID,
				statusText: "The TokenScript is signed by the attestation issuer"
			}
		}
	}

	private async validateByContractScriptUri(ipfsCid: string){

		const contract = this.tokenScript.getContractByName(this.name);

		const scriptSource = this.tokenScript.getSourceInfo();
		const [chain, contractAddress] = (scriptSource.tsId ?? "").split("-");

		// The same script Cid should be specified for all addresses in the same contract scriptUri in order to be valid
		const addresses = contract.getAddresses();

		for (const i in addresses){

			const address = addresses[i];

			let scriptUri = null;

			if (
				contractAddress &&
				scriptSource.source === "scriptUri" &&
				address.address === contractAddress &&
				address.chain === parseInt(chain)
			){
				scriptUri = scriptSource.sourceUrl;
			} else {
				// We could fetch the scriptURI of the contract and compare the IPFS hash, but for the moment this seems like overkill and is slow
				return;
				/*try {
					scriptUri = await this.tokenScript.getEngine().getScriptUri(address.chain, address.address);
				} catch (e) {
					console.warn(e);
				}*/
				// TODO: Should download file and calculate IPFS hash rather than relying on the URL?
			}

			console.log("IPFS Validator: checking source URL ", scriptUri);

			if (!scriptUri) {
				console.warn("IPFS Validator: source URL not set");
				return;
			}

			const urlCid = scriptUri.match(/^.*[\/=]?([a-zA-z1-9]{46})[\/?&.]?.*$/);

			if (!urlCid) {
				console.log("IPFS Validator: Not an IPFS URL, skipping");
				return; // Not a IPFS hosted file
			}

			if (ipfsCid !== urlCid[1]) {
				console.warn("IPFS Validator: CID does not match source URL");
				return;
			}
		}

		this.securityStatus = {
			type: AuthenticationType.IPFS_CID,
			status: SecurityStatus.VALID,
			statusText: "The TokenScript IPFS CID matches the scriptURI specified by the contract"
		}
	}
}

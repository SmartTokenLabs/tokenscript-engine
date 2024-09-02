import { ScriptSourceType } from "../Engine";
import {TokenScript} from "../TokenScript";
import {ISecurityInfo, SecurityStatus} from "../security/SecurityInfo";
import {TrustedKey, TrustedKeyResolver} from "../security/TrustedKeyResolver";
import {ethers} from "ethers";
import {ScriptSource} from "../repo/sources/SourceInterface";

export type OriginType = "contract"|"attestation"

export enum AuthenticationType {
	NONE = "none",
	IPFS_CID = "ipfsCid", // The script has been loaded from a URL specified by the ScriptUri smart contract function.
	XML_DSIG = "dsig", // The XML dsig is an EC signature, signed by the origin smart contract deployer
	IPFS_REGISTRY = "ERC-7738 Registry IPFS" // The script was defined by the 7738 registry; need to perform further validation as detailed in validateByScriptRegistry
}

export interface IOriginSecurityInfo {
	type: AuthenticationType
	status: SecurityStatus,
	statusText: string,
	signingKey?: string
	trustedKey?: TrustedKey
}

export class Origin {

	private securityStatus?: IOriginSecurityInfo
	private signingKey?: string;

	constructor(
		private tokenScript: TokenScript,
		public name: string,
		public type: OriginType
	) {

	}

	public async getOriginSecurityStatus(securityInfo: Partial<ISecurityInfo>){

		if (!this.securityStatus){

			// If the script was sourced from the Script Registry it's only deemed signed under the following cases:
			// 1: The TS is located on IPFS, and the setting wallet of the entry is the TS origin contract owner() or the current owner of Order token (1)
			// 2: The TS has a signature which is from the owner() of the contract or current owner of Order token (1)
			if (this.tokenScript.getSourceInfo().source == ScriptSourceType.SCRIPT_REGISTRY) {
				await this.validateByScriptRegistry(securityInfo);
			}

			if (!this.securityStatus && securityInfo.authoritivePublicKey)
				await this.validateBySignerKey(securityInfo.authoritivePublicKey, securityInfo.trustedKey);

			if (!this.securityStatus && this.tokenScript.getSourceInfo().source == ScriptSourceType.SCRIPT_URI && this.type === "contract")
				await this.validateByContractScriptUri(securityInfo.ipfsCid);

			if (!this.securityStatus)
				this.securityStatus = {
					type: AuthenticationType.NONE,
					status: SecurityStatus.INVALID,
					statusText: "The TokenScript is not signed by the " + (this.type == "attestation" ? "attestation issuer" : "contract deployer"),
				}

			this.securityStatus.signingKey = this.signingKey;
		}

		return this.securityStatus;
	}

	private getSelectedScript(): ScriptSource {
		const selectedTokenId = this.tokenScript.getSourceInfo().selectionId;
		const scriptSource = this.tokenScript.getSourceInfo();

		for (let i = 0; i < scriptSource?.scriptData.length; i++) {
			if (scriptSource.scriptData[i].tokenId == selectedTokenId) {
				return scriptSource.scriptData[i];
			}
		}

		return null;
	}

	private async validateByScriptRegistry(securityInfo: Partial<ISecurityInfo>) {

		//1. Discover which tokenId this is
		//2. Match the address in URL to the script in the sources
		//3. If IPFS, and script is authenticated, treat as trusted
		//4. If not IPFS, then validate from signature
		const selectedElement = this.getSelectedScript();
		const ipfsCid: string = securityInfo.ipfsCid;

		// now ensure the IPFS fetch matches
		const matches = selectedElement != undefined && selectedElement.sourceUrl.includes(ipfsCid);

		if (matches && selectedElement.authenticated) {
			this.securityStatus = this.selectAuthenticationType(selectedElement);
		}
	}
	
	private selectAuthenticationType(selectedElement: ScriptSource) {
		if (selectedElement.tokenId == 0) {
			if (selectedElement.name == '5169') {
				return {
					type: AuthenticationType.IPFS_CID,
					status: SecurityStatus.VALID,
					statusText: "The TokenScript IPFS CID matches the scriptURI specified by the contract"
				}
			} else {
				// Launchpad? If so it requires a signature
				return null;
			}
		} else {
			return {
				type: AuthenticationType.IPFS_REGISTRY,
				status: SecurityStatus.VALID,
				statusText: "The TokenScript IPFS CID matches the Authenticated scriptURI specified by the Registry"
			}
		}
	}

	private async validateBySignerKey(authPubKey: string, trustedKey?: TrustedKey){

		if (trustedKey){
			this.securityStatus = {
				type: AuthenticationType.XML_DSIG,
				status: SecurityStatus.VALID,
				statusText: "The TokenScript is signed by a trusted key",
				trustedKey
			}
			return;
		}

		if (this.type === "contract"){
			// Resolve contract owner or deployer address
			const contract = this.tokenScript.getContracts().getContractByName(this.name);

			try {
				// TODO: Handle per address/chain statuses when tokens are loaded
				// const contractKey = await (new ContractKeyResolver(this.tokenScript).resolvePublicKey(contract));

				// transform tokenscript signing key into address if required
				// const dsigKeyOrAddress = contractKey.valueType === "ethAddress" ? ethers.utils.computeAddress(publicKeyHex) : publicKeyHex;

				const dSigAddress = ethers.computeAddress(authPubKey);

				// TODO: Check signer key as well as authoritative key
				const isAdmin = await (new TrustedKeyResolver(this.tokenScript).isAdmin(contract, dSigAddress));

				// console.log("DSIG validator: revolved contract deployment key: ", contractKey);

				// if (dsigKeyOrAddress.toLowerCase() === contractKey.value.toLowerCase()) {
				if (isAdmin) {
					this.securityStatus = {
						type: AuthenticationType.XML_DSIG,
						status: SecurityStatus.VALID,
						statusText: "The TokenScript signer matches the contract deployer for this token",
						trustedKey: {
							issuerName: "Contract owner",
							valueType: "ethAddress",
							value: dSigAddress
						}
					}

					console.log("DSIG validator: DSIG matched successfully");
				} else {
					console.warn(`DSIG validator: contract key does not match DSIG( publicKeyHex: ${authPubKey}, address: ${dSigAddress})`);
				}

			} catch (e) {
				console.warn(e);
			}

		} else {
			// Match against attestation definition public key
			const definition = this.tokenScript.getAttestationDefinitions().getDefinition(this.name);

			this.signingKey = definition.keys.join(", ");

			// TODO: This will cause valid attestations to be marked as a fail, rework so status for a specific token can be fetched
			for (const key of definition.keys){
				console.log("DSIG Validator: matching attestation issuer key: ", key);
				if (authPubKey.replace("0x", "").toLowerCase() !== key.replace("0x", "").toLowerCase()) {
					console.warn("DSIG Validator: attestation issuer key does not match DSIG: ", authPubKey);
					return; // Does not match one key
				}
			}

			this.securityStatus = {
				type: AuthenticationType.XML_DSIG,
				status: SecurityStatus.VALID,
				statusText: "The TokenScript is signed by the attestation issuer",
			}
		}
	}

	private async validateByContractScriptUri(ipfsCid: string){

		const contract = this.tokenScript.getContracts().getContractByName(this.name);

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
				//       JB: Yes.
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

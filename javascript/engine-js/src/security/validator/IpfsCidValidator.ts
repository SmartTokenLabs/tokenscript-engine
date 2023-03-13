import {IScriptValidator} from "./IScriptValidator";
import {AuthenticationType, IntegrityType, ISecurityInfo, SecurityStatus} from "../SecurityInfo";
import * as IPFSOnlyHash from 'ipfs-only-hash';
import {TokenScript} from "../../TokenScript";

/**
 * IpFsCidValidator is a lightweight validation mechanism that works when the TokenScript is stored on IPFS
 * and the smart contract specifies this URL in its smart contract via ScriptURI (EIP-5169).
 *
 * The IPFS cid is re-calculated from the xml and match against the ScriptURI in order to determine authenticity & integrity.
 *
 * The main downside of this method is that the ScriptURI needs to be updated each time the TokenScript is.
 *
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-5169.md
 */
export class IpfsCidValidator implements IScriptValidator {

	private validationResult?: Partial<ISecurityInfo> = {
		auth: AuthenticationType.SCRIPT_URI,
		authText: "Authenticity verified via contract ScriptUri",
		integrity: IntegrityType.URL_HASH,
		status: SecurityStatus.INVALID
	};

	async validate(tokenscript: TokenScript, sourceUrl: string, xmlStr: string): Promise<Partial<ISecurityInfo>|false> {

		const urlCid = sourceUrl.match(/^.*[\/=]?([a-zA-z1-9]{46})[\/?&.]?.*$/);

		if (!urlCid)
			return false; // Not a IPFS hosted file

		//console.log("URL cid: ", urlCid[1]);

		const cid = await IPFSOnlyHash.of(xmlStr, null);

		//console.log("File cid: ", cid);

		if (cid === urlCid[1]){
			this.validationResult.integrityText = "IPFS CID/hash successfully validated";
			this.validationResult.status = SecurityStatus.VALID;
		} else {
			this.validationResult.integrityText = "IPFS CID in url (" + urlCid[0] + ") does not match calculated CID (" + cid + ")";
			this.validationResult.statusText = "TokenScript file integrity cannot be established";
		}

		return this.validationResult
	}

}

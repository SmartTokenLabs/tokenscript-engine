import {IScriptValidator} from "./IScriptValidator";
import * as xmldsigjs from "xmldsigjs";
import {KeyInfoX509Data, KeyValue, X509Certificate} from "xmldsigjs";
import * as x509 from "@peculiar/x509";
import {PubkeyResolver} from "../PubkeyResolver";
import {ethers} from "ethers/lib.esm";
import {Crypto, CryptoKey} from "webcrypto-liner/build/index.es";
import {TokenScript} from "../../TokenScript";
import {AuthenticationType, IntegrityType, ISecurityInfo, SecurityStatus} from "../SecurityInfo";

const crypto = new Crypto();
xmldsigjs.Application.setEngine("WebCryptoLiner", crypto);
x509.cryptoProvider.set(crypto);

/**
 * XML Digital Signature validation is the preferred method for validating TokenScripts.
 * It ensures integrity & authenticity regardless of where the TokenScript file was downloaded from.
 * The DSIG can be signed directly by the smart contract owner or other trusted party, see PubkeyResolver.
 * Alternately the trusted party can issue an X.509 certificate to another party, granting them access
 * to sign on behalf of the trusted party.
 *
 * Note: Only ECDSA DSIGs are fully supported at this time.
 */
export class DSigValidator implements IScriptValidator {

	private validationResult?: Partial<ISecurityInfo> = {
		auth: AuthenticationType.XML_DSIG,
		integrity: IntegrityType.XML_DSIG,
		status: SecurityStatus.INVALID
	};

	private dsigMasterPubKey?;

	/**
	 * Validate the authenticity & integrity of the XML DSIG
	 * @param tokenScript
	 * @param sourceUrl
	 * @param xmlStr
	 */
	async validate(tokenScript: TokenScript, sourceUrl: string, xmlStr: string): Promise<Partial<ISecurityInfo>|false> {

		let doc = xmldsigjs.Parse(xmlStr);

		let signatures = doc.getElementsByTagNameNS("http://www.w3.org/2000/09/xmldsig#", "Signature");

		console.log(signatures);

		if (!signatures.length) {
			console.log("No DSIG detected, skipping signature validation")
			return false;
		}

		try {
			await this.validateXmlSignature(doc, signatures[0]);
		} catch (e) {
			console.error(e);

			this.validationResult.integrityText = e.message;
			this.validationResult.statusText = "TokenScript authenticity and integrity cannot be established";

			return this.validationResult;
		}

		this.validationResult.integrityText = "XML DSIG successfully validated";

		try {
			await this.validateAuthorityPublicKey(tokenScript);
		} catch (e){
			console.error(e);

			this.validationResult.authText = e.message;
			this.validationResult.statusText = "TokenScript authenticity for the smart contract cannot be established";

			return this.validationResult;
		}

		this.validationResult.status = SecurityStatus.VALID;
		this.validationResult.authText = "Authenticity verified via contract owner key";

		return this.validationResult;
	}

	/**
	 * Verify signature & certificate chain (if applicable) and set the CA public key to be matched in validateAuthorityPublicKey
	 * @param doc
	 * @param signature
	 * @private
	 */
	private async validateXmlSignature(doc: XMLDocument, signature: Element){

		const xml = new xmldsigjs.SignedXml(doc);

		xml.LoadXml(signature);

		let verified = await xml.Verify();

		if (verified){
			console.log("TSML signature successfully verified!");

			const signerKey = await (xml.XmlSignature.KeyInfo.GetIterator().find((value) => value instanceof KeyValue) as KeyValue).exportKey();
			const x509Data = (xml.XmlSignature.KeyInfo.GetIterator().find((value) => value instanceof KeyInfoX509Data) as KeyInfoX509Data);

			if (x509Data && x509Data.Certificates.length > 0){

				const signerKeyHex = await this.keyToHex(signerKey);

				if (x509Data.Certificates.length > 1){
					this.dsigMasterPubKey = await this.verifyCertificateChain(x509Data.Certificates, signerKeyHex);
				} else {

					const cert = new x509.X509Certificate(x509Data.Certificates[0].GetRaw());

					const masterPubKey = await this.getSignerPublicKeyFromCertificate(cert);

					if (!await cert.verify({ publicKey: masterPubKey }))
						throw new Error("x509 certificate verification failed!");

					const cerPubKey = await this.keyToHex(await cert.publicKey.export());

					if (cerPubKey != signerKeyHex)
						throw new Error("Certificate subject public key does not match XML signing key");

					this.dsigMasterPubKey = masterPubKey;
				}

			} else {
				this.dsigMasterPubKey = signerKey;
			}

			return true;
		} else {
			throw new Error("DSIG verification failed!");
		}

	}

	/**
	 * Resolve the trusted public key for this TokenScript
	 * @param tokenScript
	 * @private
	 */
	private async validateAuthorityPublicKey(tokenScript: TokenScript){

		const cryptoKey = await this.dsigMasterPubKey;

		const dsigKey = new Uint8Array(await crypto.subtle.exportKey(cryptoKey.algorithm.name === "ECDSA" ? "raw" : "spki", cryptoKey));

		console.log("Raw public key: ", uint8tohex(dsigKey));

		// Resolve master key from contract or other location
		const keyResolver = new PubkeyResolver(tokenScript);

		const contractKey = await keyResolver.resolvePublicKey();

		console.log("contract owner or key: ", contractKey.valueType + ":" + contractKey.value);

		const dsigKeyHex = contractKey.valueType === "ethAddress" ?
			ethers.utils.computeAddress(dsigKey) :
			uint8tohex(dsigKey);

		console.log("Transformed master pubKey: ", dsigKeyHex);

		// TODO: resolve ENS name (and store in security info) for better UX

		if (dsigKeyHex.toLowerCase() !== contractKey.value.toLowerCase())
			throw new Error("Authoritive DSIG public key (" + dsigKeyHex + ") does not match resolved public key: " + contractKey.value);
	}

	/**
	 * Convert subtle CryptoKey into hex
	 * @param key
	 * @private
	 */
	private async keyToHex(key: CryptoKey){
		return uint8tohex(new Uint8Array(await crypto.subtle.exportKey(key.algorithm.name === "ECDSA" ? "raw" : "spki", key)))
	}

	/**
	 * Verify certificate chain and find CA subjectKey
	 * @param certificates
	 * @param signerKeyHex
	 * @private
	 */
	private async verifyCertificateChain(certificates: X509Certificate[], signerKeyHex: string){

		for (let [index, cert] of certificates.entries()){

			// Find certificate corresponding to the public key that signed the XML
			if (signerKeyHex === await this.keyToHex(await cert.exportKey())){

				certificates = certificates.splice(index);

				// Create & validate a certificate chain to find the root cert
				const chainBuilder = new x509.X509ChainBuilder({certificates: certificates.map(cert => new x509.X509Certificate(cert.GetRaw()))});

				const chain = await chainBuilder.build(new x509.X509Certificate(cert.GetRaw()));

				// TODO: If contract signer public key is not found, return a list of public keys to match against whitelist (in case of using RSA)
				return this.getSignerPublicKeyFromCertificate(chain[chain.length - 1]);
			}
		}

		throw new Error("The x509 certificate corresponding to the public key was not found");
	}

	// TODO: improve, this should probably use issuerDirectoryExtension and include algorithm identifiers
	/**
	 * Usually in X.509, the public key is stored by the OS or browser. Here the CA is a self-signed certificate.
	 * For simplicity, we store the public key within the certificate under the issuerAltName field.
	 * This is to accommodate signature algorithms that don't have public key recover (i.e. RSA)
	 * @param certificate
	 * @private
	 */
	private async getSignerPublicKeyFromCertificate(certificate: x509.X509Certificate){

		const issuerAltNameExt = certificate.getExtension("2.5.29.18");

		if (!issuerAltNameExt)
			throw new Error("Root certificate does not contain issuerAltName extension");

		return await crypto.subtle.importKey(
			"raw",
			new Uint8Array(issuerAltNameExt.value),
			{
				name: "ECDSA",
				namedCurve: "K-256"
			},
			true,
			["verify"]
		);
	}

}

/**
 * Convert a UInt8Array to hex
 * @param uint8
 */
function uint8tohex(uint8: Uint8Array): string {
	if (!uint8 || !uint8.length) return '';
	return Array.from(uint8).map(i => ('0' + i.toString(16)).slice(-2)).join('');
}

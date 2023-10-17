import {TokenScript} from "../TokenScript";
import * as xmldsigjs from "xmldsigjs";
import {KeyInfoX509Data, KeyValue, X509Certificate} from "xmldsigjs";
import * as x509 from "@peculiar/x509";
import {uint8tohex} from "../utils";
import {Crypto, CryptoKey} from "webcrypto-liner/build";

const crypto = new Crypto();
xmldsigjs.Application.setEngine("WebCryptoLiner", crypto);
x509.cryptoProvider.set(crypto);

export class DSigValidator {

	/**
	 * Extract the XML DSig signer key or root key in the certificate chain
	 * @param tokenScript
	 */
	public async getSignerKey(tokenScript: TokenScript): Promise<false|string>{

		const xmlStr = tokenScript.getXmlString();

		let doc = xmldsigjs.Parse(xmlStr);
		let signatures = doc.getElementsByTagNameNS("http://www.w3.org/2000/09/xmldsig#", "Signature");

		if (!signatures.length) {
			console.log("No DSIG detected, skipping signature validation")
			return false;
		}

		const xml = new xmldsigjs.SignedXml(doc);
		xml.LoadXml(signatures[0]);
		const verified = await xml.Verify();

		if (verified){

			const signerKey = await (xml.XmlSignature.KeyInfo.GetIterator().find((value) => value instanceof KeyValue) as KeyValue).exportKey();
			const x509Data = (xml.XmlSignature.KeyInfo.GetIterator().find((value) => value instanceof KeyInfoX509Data) as KeyInfoX509Data);

			if (x509Data && x509Data.Certificates.length > 0){

				const signerKeyHex = await this.keyToHex(signerKey);

				if (x509Data.Certificates.length > 1){
					return this.keyToHex(await this.verifyCertificateChain(x509Data.Certificates, signerKeyHex));
				} else {

					const cert = new x509.X509Certificate(x509Data.Certificates[0].GetRaw());

					const masterPubKey = await this.getSignerPublicKeyFromCertificate(cert);

					if (!await cert.verify({ publicKey: masterPubKey }))
						throw new Error("x509 certificate verification failed!");

					const cerPubKey = await this.keyToHex(await cert.publicKey.export());

					if (cerPubKey != signerKeyHex)
						throw new Error("Certificate subject public key does not match XML signing key");

					return signerKeyHex;
				}

			}

			return this.keyToHex(signerKey);

		} else {
			throw new Error("DSIG verification failed!");
		}
	}

	/**
	 * Convert subtle CryptoKey into hex
	 * @param key
	 * @private
	 */
	private async keyToHex(key: CryptoKey){
		return "0x" + uint8tohex(new Uint8Array(await crypto.subtle.exportKey(key.algorithm.name === "ECDSA" ? "raw" : "spki", key)))
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

import {IAttestationData, IAttestationStorageAdapter} from "./IAttestationStorageAdapter";
import {TokenScriptEngine} from "../Engine";
import {AttestationDefinition, AttestationDefinitionMeta} from "../tokenScript/attestation/AttestationDefinition";
import {Attestation} from "./Attestation";

export class AttestationManager {

	constructor(
		private engine: TokenScriptEngine,
		private storageAdapter: IAttestationStorageAdapter
	) {

	}

	public async readMagicLink(urlParams: URLSearchParams){

		//const url = new URL(link);
		//const urlParams = new URLSearchParams(url.hash.substring(1));

		const attestationStr = urlParams.get('ticket') ?? urlParams.get('attestation');
		const secret = urlParams.get('secret');
		const id = urlParams.has('id') ? urlParams.get('id') : urlParams.get('mail');
		const type = (urlParams.has('type') ? urlParams.get('type') : 'eas');

		if (type !== "eas")
			throw new Error("Attestation type " + type + " is not supported");

		if (!attestationStr)
			throw new Error('Incomplete token params in URL.')

		const meta: {[name: string]: any} = {};

		if (id) meta.id = id;
		if (secret) meta.secret = secret;

		// Decode and validate attestation
		const attestation = new Attestation(type, attestationStr, {commitmentId: id, commitmentSecret: secret});

		await attestation.verifyAttestation();

		return attestation;
	}

	public async saveAttestation(definition: AttestationDefinition, attestation: Attestation){

		const record = await attestation.getDatabaseRecord(definition.idFields);

		// TODO: Check for existing record and only update authoritative TokenScript if public key matches the signing key
		record.authoritativeTokenScript = definition.getTokenScript().getSourceInfo()

		return this.storageAdapter.saveAttestation(record);
	}

	public async getAttestations(definition: AttestationDefinition){

		const collectionHashes = definition.calculateAttestationCollectionHashes();

		//TODO: Add additional logic to check if it's the authoritative tokenscript.
		//  We should treat the meta title/image/desc in the authoritative tokenscript.
		//  If this definition does not match the authoritative one, fetch the authoritative tokenscript to show meta.

		const attests = await this.storageAdapter.getAttestations(collectionHashes);

		for (const attest of attests){

			const defMeta = definition.meta;

			attest.meta = {
				...attest.meta,
				name: defMeta.name,
				description: defMeta.description,
				image: defMeta.image,
				attributes: this.getMetaAttributes(defMeta, attest)
			};
		}

		return attests;
	}

	private getMetaAttributes(defMeta: AttestationDefinitionMeta, attest: IAttestationData){

		const attributes = [];

		for (const attrDef of defMeta.attributes){

			const pathParts = attrDef.name.split(".");

			let value = null;

			switch(pathParts[0]){
				case "data":
					if (attest.decodedData[pathParts[1]])
						value = attest.decodedData[pathParts[1]];

					break;
				case "meta":
					if (attest.meta[pathParts[1]])
						value = attest.meta[pathParts[1]];

					break;
				default:
					if (attest.decodedToken.message[pathParts[0]])
						value = attest.decodedToken.message[pathParts[0]];
			}

			if (!value){
				console.warn("attribute field value for " + attrDef.name + " was not found");
				continue;
			}

			attributes.push({
				trait_type: attrDef.label,
				value
			});
		}

		return attributes;
	}

	public async removeAttestation(collectionHash: string, id: string){
		return this.storageAdapter.removeAttestation(collectionHash, id);
	}

}

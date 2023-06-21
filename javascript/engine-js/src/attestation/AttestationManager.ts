import {IAttestationStorageAdapter} from "./IAttestationStorageAdapter";
import {TokenScriptEngine} from "../Engine";
import {AttestationDefinition} from "../tokenScript/attestation/AttestationDefinition";
import {Attestation} from "./Attestation";
import {sha256} from "ethers/lib/utils";

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

		// Decode and validate attestation
		const attestation = new Attestation(type, attestationStr, id, secret);

		await attestation.verifyAttestation();

		return attestation;
	}

	public async saveAttestation(definition: AttestationDefinition, attestation: Attestation){

		const id = await attestation.getAttestationId(definition.idFields);

		console.log("Attestation ID: " + id);
	}

	public async getAttestations(definition: AttestationDefinition){

		const collectionHashes = definition.calculateAttestationCollectionHashes();


	}

	public async removeAttestation(definition: AttestationDefinition, id: string){
		// TODO: Implement removal
	}



}

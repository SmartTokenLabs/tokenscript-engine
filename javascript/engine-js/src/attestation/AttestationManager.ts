import {IAttestationStorageAdapter} from "./IAttestationStorageAdapter";
import {TokenScriptEngine} from "../Engine";
import {AttestationDefinition} from "../tokenScript/attestation/AttestationDefinition";
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

		// Decode and validate attestation
		const attestation = new Attestation(type, attestationStr, id, secret);

		await attestation.verifyAttestation();

		const data = await attestation.getAttestationData()

		console.log("Attestation data: ", data);

		return attestation;
	}

	private async saveAttestation(){

	}

	public async getAttestations(definition: AttestationDefinition){

	}

}

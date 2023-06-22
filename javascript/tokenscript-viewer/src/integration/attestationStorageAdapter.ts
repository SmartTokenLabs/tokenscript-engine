import {
	IAttestationData,
	IAttestationStorageAdapter
} from "@tokenscript/engine-js/src/attestation/IAttestationStorageAdapter";
import {dbProvider} from "../providers/databaseProvider";

export class AttestationStorageAdapter implements IAttestationStorageAdapter {

	async getAttestations(collectionIds: string[]): Promise<IAttestationData[]> {
		return (await dbProvider.attestations.where("collectionId").anyOf(collectionIds)).toArray();
	}

	async removeAttestation(collectionId: string, tokenId: string): Promise<void> {
		await dbProvider.attestations.where({
			collectionId,
			tokenId
		}).delete()
	}

	async saveAttestation(attestationData: IAttestationData): Promise<void> {
		await dbProvider.attestations.put(attestationData);
	}

}

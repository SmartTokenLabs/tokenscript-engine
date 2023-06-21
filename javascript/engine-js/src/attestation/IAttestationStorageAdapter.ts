
export interface IAttestationData {

}

export interface IAttestationStorageAdapter {
	saveAttestation(collectionHash: string, id: string, attestationData: IAttestationData): Promise<void>;
}

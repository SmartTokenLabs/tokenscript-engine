import { SignedOffchainAttestation } from '@ethereum-attestation-service/eas-sdk';

export interface ISLNAttestation {
  rawData: SignedOffchainAttestation;
}

export interface ISLNAdapter {
  getAttestation(attester: string, uid: string): Promise<ISLNAttestation>;
}

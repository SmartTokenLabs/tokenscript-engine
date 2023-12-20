import { SignedOffchainAttestation } from '@ethereum-attestation-service/eas-sdk';

export interface ISLNAttestation {
  uid: string;
  attester: string;
  subject: string;
  schema: string;
  decoded: unknown;
  createdAt: number;
  rawData: SignedOffchainAttestation;
}

export interface ISLNAdapter {
  getAttestation(attester: string, uid: string): Promise<ISLNAttestation>;
}

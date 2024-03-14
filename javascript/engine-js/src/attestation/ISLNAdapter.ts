import { SignedOffchainAttestation } from '@ethereum-attestation-service/eas-sdk';
import { Provider } from 'ethers';

export interface ISLNAttestation {
  rawData: SignedOffchainAttestation;
}

export interface ISLNAdapter {
  getAttestation(attester: string, tokenId: string, chain: string, provider: Provider): Promise<{ attestation: ISLNAttestation; decoded: any }>;
}

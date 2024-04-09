import { SignedOffchainAttestation } from '@ethereum-attestation-service/eas-sdk';
import { Provider } from 'ethers';

export interface ISLNAttestation {
  rawData: SignedOffchainAttestation;
}

export interface ISLNAdapter {
  getAttestation(attester: string, tokenId: string, chain: string): Promise<ISLNAttestation>;
  decodeAttestation(rawData: SignedOffchainAttestation, provider: Provider);
}

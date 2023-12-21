import { ISLNAdapter, ISLNAttestation } from '@tokenscript/engine-js/src/attestation/ISLNAdapter';

export class SLNAdapter implements ISLNAdapter {
  private url: string;

  constructor(chain: number) {
    this.url =
      chain === 5169
        ? 'TBD' // mainnet
        : 'https://sln-nodes-server.autographnft.io/'; // testnet [1337, 82459]
  }

  async getAttestation(attester: string, tokenId: string): Promise<ISLNAttestation> {
    const path = `attestations/${attester}/${tokenId}`;

    return this.fetchRequest(path);
  }

  private async fetchRequest(path: string) {
    try {
      const response = await fetch(this.url + path);
      const ok = response.status >= 200 && response.status <= 299;
      if (!ok) {
        console.warn('SLN api request failed: ', path);
        return null;
      }

      return response.json();
    } catch (msg: any) {
      return null;
    }
  }
}

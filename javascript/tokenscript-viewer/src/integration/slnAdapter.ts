import { ISLNAdapter, ISLNAttestation } from '@tokenscript/engine-js/src/attestation/ISLNAdapter';

export class SLNAdapter implements ISLNAdapter {
  private url: string;

  constructor(chain: number) {
    this.url =
      chain === 5169
        ? 'TBD' // mainnet
        : 'https://d2sc5n1wf6rato.cloudfront.net/'; // testnet [1337, 82459]
    //'https://d3tm4hby53qtu1.cloudfront.net/';
  }

  async getAttestation(attester: string, tokenId: string, chain: string): Promise<ISLNAttestation> {
    //todo add signature /rawdata?message=${message}&signature=${signature}`

    const path = `attestations/${attester}/${tokenId}/rawdata`;

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

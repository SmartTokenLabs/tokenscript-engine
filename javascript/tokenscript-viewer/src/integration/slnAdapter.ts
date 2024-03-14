import { ISLNAdapter, ISLNAttestation } from '@tokenscript/engine-js/src/attestation/ISLNAdapter';
import { CHAIN_EAS_SCHEMA_REGI_MAP, ChainID } from './constants';
import { SchemaDecodedItem, SchemaEncoder, SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
import { Provider } from 'ethers';

export class SLNAdapter implements ISLNAdapter {
  private url: string;

  constructor(chain: number) {
    this.url =
      chain === 5169
        ? 'TBD' // mainnet
        : 'https://d2sc5n1wf6rato.cloudfront.net/'; // testnet [1337, 82459]
    //'https://d3tm4hby53qtu1.cloudfront.net/';
  }

  async getAttestation(attester: string, tokenId: string, chain: string, provider: Provider): Promise<{ attestation: ISLNAttestation; decoded: any }> {
    //todo add signature /rawdata?message=${message}&signature=${signature}`

    const path = `attestations/${attester}/${tokenId}/rawdata`;

    const attestation: ISLNAttestation = await this.fetchRequest(path);

    const rawData = attestation.rawData;

    const decoded = this.decodeData(await this.getSchemaSignature(rawData.message.schema, Number(rawData.domain.chainId), provider), rawData.message.data);

    return { attestation, decoded };
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

  private async getSchemaSignature(uid: string, chainId: ChainID, provider: Provider) {
    console.log(chainId, CHAIN_EAS_SCHEMA_REGI_MAP[chainId]);
    const schemaReg: SchemaRegistry = new SchemaRegistry(CHAIN_EAS_SCHEMA_REGI_MAP[chainId]);
    schemaReg.connect(provider);
    const schema = await schemaReg.getSchema({ uid });
    return schema.schema;
  }

  private decodeData(schema: string, data: string) {
    const schemaEncoder = new SchemaEncoder(schema);
    const decoded = schemaEncoder.decodeData(data);
    // Assumption: one layer only, no embedded schema
    const formatted: { [key: string]: any } = {};
    const itemSchema: { [key: string]: SchemaDecodedItem } = {};
    decoded.forEach(item => {
      formatted[item.name] = item.value.value;
      itemSchema[item.name] = item;
    });
    return { formatted, raw: itemSchema };
  }
}

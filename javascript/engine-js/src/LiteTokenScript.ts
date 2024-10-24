import { ITokenCollection } from './tokens/ITokenCollection';
import { ITokenContextData } from './tokens/ITokenContextData';

import { ITokenContext, ITokenIdContext, ITransactionListener, TokenMetadataMap } from './ITokenScript';
import { Card } from './tokenScript/Card';
import { AbstractTokenScript } from './AbstractTokenScript';

/**
 * This is a lightweight and headless version of TokenScript.
 * The dependencies for view rendering are removed,
 * So this is typically used for tokenscript parsing, and supporting custom rendering of the tokenscript view
 */
export class LiteTokenScript extends AbstractTokenScript {

  public async getTokenContextData(tokenIdContext?: ITokenIdContext) {
    let data: ITokenContextData;

    const contracts = this.getContracts().getContractsMap(true);
    const primaryAddr = contracts[Object.keys(contracts)[0]].getFirstAddress();

    data = {
      name: this.getName(),
      label: this.getLabel(),
      contractAddress: primaryAddr?.address,
      chainId: primaryAddr?.chain,
      ownerAddress: await this.getCurrentWalletAddress(),
      balance: '0',
    };

    return data;
  }

  public setCurrentTokenContextFrom(tokenContext: ITokenContext) {
    this.tokenContext = tokenContext;
  }

  // Not implemented for LiteTokenScript
  public getViewController(): any {
    throw new Error('LiteTokenScript does not support the operation');
  }
  public hasViewBinding(): boolean {
    throw new Error('LiteTokenScript does not support the operation');
  }
  public getViewBinding(): any {
    throw new Error('LiteTokenScript does not support the operation');
  }
  public setViewBinding(viewBinding: any): void {
    throw new Error('LiteTokenScript does not support the operation');
  }
  public showOrExecuteTokenCard(card: Card, transactionListener?: ITransactionListener): Promise<void> {
    throw new Error('LiteTokenScript does not support the operation');
  }
  public getTokenMetadata(reloadFromAdapter?: boolean, bypassCache?: boolean, alwaysFireEvent?: boolean): Promise<TokenMetadataMap> {
    throw new Error('LiteTokenScript does not support the operation');
  }
  public resolveTokenMetadata(reload: boolean): Promise<ITokenCollection[]> {
    throw new Error('LiteTokenScript does not support the operation');
  }
  public setTokenDiscoveryAdapter(adapter: any): void {
    throw new Error('LiteTokenScript does not support the operation');
  }
}

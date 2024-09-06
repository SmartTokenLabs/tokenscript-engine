import { ScriptSourceType, TokenScriptEngine } from './Engine';
import { Transaction } from './tokenScript/Transaction';
import { ITokenCollection } from './tokens/ITokenCollection';
import { Attributes } from './tokenScript/Attributes';
import { SecurityInfo } from './security/SecurityInfo';
import { Selections } from './tokenScript/selection/Selections';
import { Label } from './tokenScript/Label';
import { AttestationDefinitions } from './tokenScript/attestation/AttestationDefinitions';
import { Attestation } from './attestation/Attestation';
import { Origin } from './tokenScript/Origin';
import { ITokenContextData } from './tokens/ITokenContextData';
import { Meta } from './tokenScript/Meta';
import { ethers } from 'ethers';
import { TransactionValidator } from './security/TransactionValidator';
import { Contracts } from './tokenScript/Contracts';
import { Cards } from './tokenScript/Cards';

import { ScriptInfo } from './repo/sources/SourceInterface';
import { EventHandler, ITokenContext, ITokenIdContext, ITransactionListener, TokenMetadataMap, TokenScript, TokenScriptEvents } from './TokenScript';
import { ViewController } from './view/ViewController';

/**
 * The TokenScript object represents a single instance of a TokenScript.
 * The TS XML is parsed into various sub-objects on-demand that roughly reflect the structure of the XML.
 * This class contains various top-level methods for getting TokenScript data, showing TokenScript cards &
 * executing transactions
 */
export class LiteTokenScript implements TokenScript {
  private label?: Label;

  private meta?: Meta;

  private origins?: { [originName: string]: Origin };

  private contracts?: Contracts;

  private cards?: Cards;

  private attributes?: Attributes;

  private attestationDefinitions?: AttestationDefinitions;

  private selections?: Selections;

  private tokenContext?: ITokenContext;

  private securityInfo: SecurityInfo;

  private eventHandlers: { [eventName: string]: { [handlerId: string]: EventHandler } } = {};

  public readonly transactionValidator: TransactionValidator;

  constructor(
    private engine: TokenScriptEngine,
    public readonly tokenDef: XMLDocument,
    public readonly xmlStr: string,
    private source: ScriptSourceType,
    private sourceId: string,
    private sourceUrl: string,
    private scriptInfo?: ScriptInfo,
  ) {
    if (this.tokenDef?.documentElement?.tagName !== 'ts:token') throw new Error('The provided file is not a valid TokenScript');

    this.securityInfo = new SecurityInfo(this);
    this.transactionValidator = new TransactionValidator(this);
  }

  public getSourceInfo() {
    return {
      // TODO: Use better UID for non-resolved tokenscripts
      tsId: this.sourceId + (this.scriptInfo?.scriptId ? '-' + this.scriptInfo.scriptId : '') ?? this.getName(),
      source: this.source,
      sourceUrl: this.sourceUrl,
      scriptInfo: this.scriptInfo,
    };
  }

  /**
   * Emit a TokenScript event to the user-agent
   * @param eventType
   * @param params
   * @private
   */
  public emitEvent<
    T extends keyof TokenScriptEvents, // <- T points to a key
    R extends TokenScriptEvents[T], // <- R points to the type of that key
  >(eventType: T, params?: R) {
    if (this.eventHandlers[eventType])
      for (const handler of Object.values(this.eventHandlers[eventType])) {
        handler(params);
      }
  }

  /**
   * Register an event listener to receive TokenScript events
   * @param eventType
   * @param callback
   * @param id - The ID of the event handler, used to avoid duplicate handlers & remove handlers
   */
  public on<
    T extends keyof TokenScriptEvents, // <- T points to a key
    R extends (data: TokenScriptEvents[T]) => Promise<void> | void, // <- R points to the type of that key
  >(eventType: T, callback: R, id: string = 'default') {
    if (!this.eventHandlers[eventType]) this.eventHandlers[eventType] = {};

    this.eventHandlers[eventType][id] = callback;
  }

  /**
   * Remove an event listener
   * @param eventType
   * @param id The ID of the handler to remove - if not specified then all handlers are removed.
   */
  public off<
    T extends keyof TokenScriptEvents, // <- T points to a key
  >(eventType: T, id?: string) {
    if (!id) {
      delete this.eventHandlers[eventType];
      return;
    }

    delete this.eventHandlers[eventType][id];
  }

  /**
   * Returns the XML string for the TokenScript
   */
  public getXmlString() {
    return this.xmlStr;
  }

  /**
   * Returns the parsed XML DOM object for the TokenScript
   */
  public getXml() {
    return this.tokenDef;
  }

  /**
   * The instance of TokenScriptEngine that created this TokenScript
   */
  public getEngine() {
    return this.engine;
  }

  /**
   * The SecurityInfo object related to this TokenScript
   */
  public getSecurityInfo() {
    return this.securityInfo;
  }

  /**
   * The common name of the TokenScript
   */
  public getName() {
    return this.tokenDef.documentElement.getAttribute('name');
  }

  /**
   * The label for the TokenScript
   * @param pluralQty
   */
  public getLabel(pluralQty?: number) {
    if (!this.label) this.label = new Label(this.tokenDef.documentElement);

    return this.label.getValue(pluralQty) ?? this.getName() ?? 'Unnamed TokenScript';
  }

  /**
   * The metadata for the TokenScript
   */
  public getMetadata() {
    if (!this.meta) this.meta = new Meta(this.tokenDef.documentElement);

    return this.meta;
  }

  /**
   * Cards for the TokenScript
   */
  public getCards(): Cards {
    if (!this.cards) {
      this.cards = new Cards(this);
    }
    return this.cards;
  }

  /**
   * Contracts for the TokenScript
   */
  public getContracts() {
    if (!this.contracts) {
      this.contracts = new Contracts(this);
    }

    return this.contracts;
  }

  public getOrigins() {
    if (!this.origins) {
      const origins = this.tokenDef.documentElement.getElementsByTagName('ts:origins');

      this.origins = {};

      for (let i in origins[0].children) {
        const origin = origins[0].children[i];

        if (!origin.tagName) continue;

        if (origin.tagName == 'ts:ethereum') {
          const contractName = origin.getAttribute('contract');
          this.origins[contractName] = new Origin(this, contractName, 'contract');
        } else if (origin.tagName == 'ts:attestation') {
          const attestDefName = origin.getAttribute('name');
          this.origins[attestDefName] = new Origin(this, attestDefName, 'attestation');
        } else {
          console.warn('Token origin with tag ' + origin.tagName + ' is not supported');
        }
      }
    }

    return this.origins;
  }

  /**
   * Returns the viewContent with the provided name.
   * Multiple actions can share the same HTML/JS/CSS code to reduce duplication in the XML
   * @param name The viewContent name as defined by the "name" object in the XML
   */
  public getViewContent(name: string) {
    const viewContents = this.tokenDef.documentElement.getElementsByTagName('ts:viewContent');

    for (let i in viewContents) {
      if (viewContents[i].getAttribute('name') === name) {
        return viewContents[i].children;
      }
    }

    return null;
  }

  /**
   * Get initial origin token data for the TokenScript
   */
  public getTokenOriginData() {
    return this.buildTokenDiscoveryData();
  }

  public async getTokenContextData(tokenIdContext?: ITokenIdContext) {
    let data: ITokenContextData;

    const contracts = this.getContracts().getContractsMap(true);
    const primaryAddr = contracts[Object.keys(contracts)[0]].getFirstAddress();

    data = {
      name: this.getName(),
      label: this.getLabel(),
      contractAddress: primaryAddr?.address,
      chainId: primaryAddr?.chain,
      ownerAddress: await this.getCurrentOwnerAddress(),
      balance: '0',
    };

    return data;
  }

  public async getCurrentOwnerAddress() {
    // TODO: ownerAddress should probably come from token details rather than the current wallet
    try {
      const walletProvider = await this.engine.getWalletAdapter();
      return await walletProvider.getCurrentWalletAddress();
    } catch (e) {
      console.warn(e);
    }

    return ethers.ZeroAddress;
  }

  /**
   * Prepare initial token meta to be sent to the TokenDiscoveryAdapter
   * @param originOnly
   * @private
   */
  private buildTokenDiscoveryData(originOnly = true) {
    const originContracts = this.getContracts().getContractsMap(originOnly);

    const initialTokenDetails: ITokenCollection[] = [];

    for (let i in originContracts) {
      const contract = originContracts[i];

      // TODO: how to handle multiple addresses for each origin? Ask James Brown.
      const addresses = contract.getAddresses();

      for (let key in addresses) {
        initialTokenDetails.push({
          originId: i, // TODO: ensure that this is unique
          blockChain: 'eth',
          tokenType: contract.getInterface(),
          chainId: addresses[key].chain,
          contractAddress: addresses[key].address,
        });
      }
    }

    return initialTokenDetails;
  }

  public unsetTokenContext() {
    this.tokenContext = null;
  }

  /**
   * Set the current token context that's used when showing cards and resolving attributes.
   * Any attribute using 'tokenId' reference will use this context to resolve attributes by default
   * @param contractName
   * @param tokenIndex
   * @param tokenId
   */
  public setCurrentTokenContext(contractName: string, tokenIndex: number | null = null, tokenId: string | null = null) {
    const tokenOriginsData = this.getTokenOriginData();
    const tokenCollection = tokenOriginsData.find(token => token.originId === contractName);

    if (!tokenCollection) {
      throw new Error(`Cannot set token context: token origin with contract name ${contractName} was not found`);
    }

    this.tokenContext = {
      originId: contractName,
      selectedTokenIndex: tokenIndex,
      selectedTokenId: tokenId,
      blockChain: tokenCollection.blockChain,
      chainId: tokenCollection.chainId,
      tokenType: tokenCollection.tokenType,
      contractAddress: tokenCollection.contractAddress,
      balance: tokenCollection.balance,
    };
  }

  /**
   * The current token context
   * selectedNftId & selectedNftIndex are only populated if the token is non-fungible (ERC-721)
   */
  public getCurrentTokenContext() {
    return this.tokenContext;
  }

  /**
   * The top-level (global) attributes for this TokenScript
   */
  public getAttributes() {
    if (!this.attributes) {
      this.attributes = new Attributes(this, this.tokenDef.documentElement);
    }

    return this.attributes;
  }

  /**
   * The attestation definitions defined in the TokenScripts
   */
  public getAttestationDefinitions(originsOnly = true) {
    if (!this.attestationDefinitions) {
      this.attestationDefinitions = new AttestationDefinitions(this, this.tokenDef.documentElement);
    }

    if (originsOnly) this.attestationDefinitions.getOriginDefinitions();

    return this.attestationDefinitions;
  }

  /**
   * Selection filters for the TokenScript
   * These are used to disable cards/actions based on some conditions - such as disabling an action for a certain range of tokens
   */
  public getSelections() {
    if (!this.selections) {
      this.selections = new Selections(this, this.tokenDef.documentElement);
    }

    return this.selections;
  }

  /**
   * Returns the ASN module definition by name
   * ASN module definitions are used to specify the schema that is needed to decode ASN encoded data
   * Currently it is only used for ethereum event decoding, but it will be used later for attestations (off-chain tokens)
   * @param name
   */
  public getAsnModuleDefinition(name) {
    const modules = this.tokenDef.getElementsByTagName('asnx:module')[0];
    return modules.querySelector('[name=' + name + ']');
  }

  /**
   * Execute the TokenScript transaction
   * @param transaction TokenScript transaction object
   * @param listener A listener function to receive transaction update events
   * @param waitForConfirmation Wait for transaction confirmation
   */
  public async executeTransaction(transaction: Transaction, listener?: ITransactionListener, waitForConfirmation: boolean = true) {
    const wallet = await this.engine.getWalletAdapter();
    const transInfo = transaction.getTransactionInfo();

    // TODO: confirm with James exact use cases of having multiple address in a contract element
    const chain = this.getCurrentTokenContext()?.chainId ?? (await wallet.getChain());
    const contractAddr = transInfo.contract.getAddressByChain(chain, true);

    // If validation callback returns false we abort silently
    if (!(await this.transactionValidator.validateContract(chain, contractAddr.address, transInfo.contract, transInfo.function))) return false;

    const errorAbi = transInfo.contract.getAbi('error');

    const ethParams = [];

    for (let i in transInfo.args) {
      ethParams.push(await transInfo.args[i].getEthersArgument(this.getCurrentTokenContext(), transInfo.function, transInfo.contract));
    }

    const ethValue = transInfo.value ? await transInfo?.value?.getValue(this.getCurrentTokenContext()) : null;

    listener({ status: 'started' });

    return await wallet.sendTransaction(contractAddr.chain, contractAddr.address, transInfo.function, ethParams, [], ethValue, waitForConfirmation, listener, errorAbi);
  }

  // Not implemented for LiteTokenScript
  public getViewController(): ViewController {
    throw new Error('LiteTokenScript does not support getViewController');
  }
}

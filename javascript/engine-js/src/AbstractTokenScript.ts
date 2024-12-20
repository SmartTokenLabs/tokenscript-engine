import {ethers, ZeroAddress} from 'ethers';
import { ITokenScriptEngine, ScriptSourceType } from './IEngine';
import { SecurityInfo } from './security/SecurityInfo';
import { TransactionValidator } from './security/TransactionValidator';
import { Attributes } from './tokenScript/Attributes';
import { Cards } from './tokenScript/Cards';
import { Contracts } from './tokenScript/Contracts';
import { Label } from './tokenScript/Label';
import { Meta } from './tokenScript/Meta';
import { Origin } from './tokenScript/Origin';
import { Transaction } from './tokenScript/Transaction';
import { AttestationDefinitions } from './tokenScript/attestation/AttestationDefinitions';
import { Selections } from './tokenScript/selection/Selections';
import { ITokenCollection } from './tokens/ITokenCollection';
import { ITokenContextData } from './tokens/ITokenContextData';

import { EventHandler, ITokenContext, ITokenIdContext, ITokenScript, ITransactionListener, TokenMetadataMap, TokenScriptEvents } from './ITokenScript';
import { ScriptInfo } from './repo/sources/SourceInterface';
import { Card } from './tokenScript/Card';
import { ViewStyles } from './view/ViewStyles';
import {TXOptions} from "./view/ViewController";

/**
 * The TokenScript object represents a single instance of a TokenScript.
 * The TS XML is parsed into various sub-objects on-demand that roughly reflect the structure of the XML.
 * This class contains various top-level methods for getting TokenScript data, showing TokenScript cards &
 * executing transactions
 */
export abstract class AbstractTokenScript implements ITokenScript {
  protected label?: Label;

  protected meta?: Meta;

  protected origins?: { [originName: string]: Origin };

  protected contracts?: Contracts;

  protected cards?: Cards;

  protected attributes?: Attributes;

  protected attestationDefinitions?: AttestationDefinitions;

  protected selections?: Selections;

  protected tokenMetadata?: TokenMetadataMap;

  protected tokenContext?: ITokenContext;

  protected securityInfo: SecurityInfo;

  protected eventHandlers: { [eventName: string]: { [handlerId: string]: EventHandler } } = {};

  public readonly viewStyles: ViewStyles;

  public readonly transactionValidator: TransactionValidator;

  constructor(
    protected engine: ITokenScriptEngine,
    public readonly tokenDef: XMLDocument,
    public readonly xmlStr: string,
    protected source: ScriptSourceType,
    protected sourceId: string,
    protected sourceUrl: string,
    protected scriptInfo?: ScriptInfo,
  ) {
    if (this.tokenDef?.documentElement?.tagName !== 'ts:token') throw new Error('The provided file is not a valid TokenScript');

    this.securityInfo = new SecurityInfo(this);
    this.viewStyles = new ViewStyles(this.tokenDef);
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

	public async getTokenContextData(tokenIdContext?: ITokenIdContext){

		let tokenContext: ITokenContext;

		if (tokenIdContext){

			// Get token context object from ITokenIdContext
			tokenContext = this.tokenMetadata[tokenIdContext.originId];
			let tokenIndex = undefined;

			if (tokenContext.tokenDetails)
				for (const [index, token] of Object.entries(tokenContext.tokenDetails)){
					if (token.tokenId === tokenIdContext.selectedTokenId){
						tokenIndex = index;
						break;
					}
				}

			tokenContext = {
				...this.tokenMetadata[tokenIdContext.originId],
				selectedTokenId: tokenIdContext.selectedTokenId,
				selectedTokenIndex: tokenIndex
			};

		} else {
			tokenContext = this.tokenContext;
		}

		let data: ITokenContextData;

		if (tokenContext){

			const tokenDetails = tokenContext.selectedTokenIndex !== undefined ? tokenContext.tokenDetails[tokenContext.selectedTokenIndex] : null;

			const balance = tokenContext.balance ? tokenContext.balance.toString() : "0"; // bigint can't be json serialized, so it must always be string

			const image = this.getMetadata().imageUrl ?? tokenDetails?.image ?? tokenContext.image ?? this.getMetadata().iconUrl;

			data = {
				name: tokenDetails?.name ?? tokenContext.name,
				description: tokenDetails?.description ?? tokenContext.description,
				label: tokenContext.name,
				symbol: tokenContext.symbol,
				_count: balance,
				balance,
				decimals: tokenContext.decimals,
				contractAddress: tokenContext.contractAddress,
				chainId: tokenContext.chainId,
				tokenId: tokenContext.selectedTokenId,
				ownerAddress: tokenContext.tokenType === "erc20" ? await this.getCurrentWalletAddress() : ZeroAddress,
				image_preview_url: image,
				image
			};

			if (tokenDetails) {

				data.tokenInfo = {
					collectionId: tokenDetails.collectionId,
					tokenId: tokenDetails.tokenId,
					type: tokenContext.tokenType,
					name: tokenDetails.name ?? tokenDetails.data?.title,
					description: tokenDetails.description,
					image,
					attributes: tokenDetails.attributes ?? [],
					data: tokenDetails.data
				}

				if (tokenDetails.ownerAddress)
					data.ownerAddress = tokenDetails.ownerAddress;

				// Extract top level attestation fields for use in transaction inputs.
				if (tokenDetails?.data?.abiEncoded) {
					data.attestation = tokenDetails.data.abiEncoded.attestation;
					data.attestationSig = tokenDetails.data.abiEncoded.signature;
				}
			}

		} else {
			const contracts = this.getContracts().getContractsMap(true);

			const primaryAddr = contracts[Object.keys(contracts)[0]].getFirstAddress();

			data = {
				name: this.getName(),
				label: this.getLabel(),
				contractAddress: primaryAddr?.address,
				chainId: primaryAddr?.chain,
				ownerAddress: await this.getCurrentWalletAddress(),
				balance: "0"
			};
		}

		return data;
	}

  public async getCurrentWalletAddress() {
	  // TODO: We need a way to override owner address in the case of ERC-20
	  //  (as the owner/sharer of the token card may be different to the connected wallet address)
	  const walletProvider = await this.engine.getWalletAdapter();
      return await walletProvider.getCurrentWalletAddress();
  }

  /**
   * Prepare initial token meta to be sent to the TokenDiscoveryAdapter
   * @param originOnly
   * @private
   */
  protected buildTokenDiscoveryData(originOnly = true) {
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
          tokenType: contract.getInterface() ?? "erc721",
          chainId: addresses[key].chain,
          contractAddress: addresses[key].address
        });
      }
    }

    return initialTokenDetails;
  }

  public unsetTokenContext() {
    this.tokenContext = null;
  }

	/**
	 * Manually set TokenScript metadata.
	 * This can be used for the user-agent to push token updates rather than calling getTokenMeta with the refresh option
	 * @param tokenMetadata
	 */
	public setTokenMetadata(tokenMetadata: ITokenCollection[]){
		const metaMap: TokenMetadataMap = {};

		for (let meta of tokenMetadata){
			metaMap[meta.originId] = meta;
		}

		this.tokenMetadata = metaMap;
		this.emitEvent("TOKENS_UPDATED", {tokens: this.tokenMetadata})
	}

  /**
   * Set the current token context that's used when showing cards and resolving attributes.
   * Any attribute using 'tokenId' reference will use this context to resolve attributes by default
   * @param contractName
   * @param tokenIndex
   * @param tokenId
   */
  public setCurrentTokenContext(contractName: string, tokenIndex: number | null, tokenId: string | null){

	  if (!this.tokenMetadata[contractName]){
		  throw new Error("Cannot set token context: contractName was not found")
	  }

	  if (tokenIndex == null && tokenId == null){
		  this.tokenContext = this.tokenMetadata[contractName];
		  return;
	  }

	  if (tokenIndex != null && !this.tokenMetadata[contractName].tokenDetails?.[tokenIndex]){
		  throw new Error("Cannot set token context: token index was not found")
	  }

	  if (tokenId != null){
		  const tokenDetails = this.tokenMetadata[contractName].tokenDetails;
		  if (!tokenDetails)
			  throw new Error("Cannot set token context: token ID was provided but the origin contract is a fungible token");
		  tokenIndex = tokenDetails.findIndex((tokenDetails) => tokenDetails.tokenId === tokenId);
		  if (tokenIndex === -1)
			  throw new Error(`Cannot set token context: a token with provided ID ${tokenId} was not found`);
	  }

	  this.tokenContext = this.tokenMetadata[contractName];
	  this.tokenContext.originId = contractName;
	  this.tokenContext.selectedTokenIndex = tokenIndex;
	  this.tokenContext.selectedTokenId = this.tokenMetadata[contractName].tokenDetails[tokenIndex].tokenId;
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
   * @param txOptions Options provided
   * @param waitForConfirmation Wait for transaction confirmation
   */
  public async executeTransaction(transaction: Transaction, listener?: ITransactionListener, txOptions?: TXOptions, waitForConfirmation: boolean = true) {
    const wallet = await this.engine.getWalletAdapter();
    const transInfo = transaction.getTransactionInfo();

    const chain = txOptions?.chainId ?? this.getCurrentTokenContext()?.chainId ?? (await wallet.getChain());
    const contractAddr = txOptions?.contractAddress ? {chain, address: txOptions.contractAddress} : transInfo.contract.getAddressByChain(chain, true);

    // If validation callback returns false we abort silently
    if (!(await this.transactionValidator.validateContract(chain, contractAddr.address, transInfo.contract, transInfo.function))) return false;

    const errorAbi = transInfo.contract.getAbi('error');

    const ethParams = [];

    for (let i in transInfo.args) {
      ethParams.push(await transInfo.args[i].getEthersArgument(this.getCurrentTokenContext(), transInfo.function, transInfo.contract));
    }

	// TODO: Allow getting chain & address override values from an attribute too?
    const ethValue = transInfo.value ? await transInfo?.value?.getValue(this.getCurrentTokenContext()) : null;

    listener({ status: 'started' });

    return await wallet.sendTransaction(contractAddr.chain, contractAddr.address, transInfo.function, ethParams, [], ethValue, waitForConfirmation, listener, errorAbi);
  }

  public abstract getViewController(): any;
  public abstract hasViewBinding(): boolean;
  public abstract getViewBinding(): any;
  public abstract setViewBinding(viewBinding: any): void;
  public abstract showOrExecuteTokenCard(card: Card, transactionListener?: ITransactionListener): Promise<void>;
  public abstract getTokenMetadata(reloadFromAdapter?: boolean, bypassCache?: boolean, alwaysFireEvent?: boolean): Promise<TokenMetadataMap>;
  public abstract resolveTokenMetadata(reload: boolean): Promise<ITokenCollection[]>;
  public abstract setTokenDiscoveryAdapter(adapter: any): void;
}

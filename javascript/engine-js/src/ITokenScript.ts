import {ITokenScriptEngine, ScriptSourceType} from './IEngine';
import {SecurityInfo} from './security/SecurityInfo';
import {TransactionValidator} from './security/TransactionValidator';
import {ITokenCollection} from './tokens/ITokenCollection';
import {ITokenContextData} from './tokens/ITokenContextData';
import {ITokenDiscoveryAdapter} from './tokens/ITokenDiscoveryAdapter';
import {AttestationDefinitions} from './tokenScript/attestation/AttestationDefinitions';
import {Attributes} from './tokenScript/Attributes';
import {Card} from './tokenScript/Card';
import {Cards} from './tokenScript/Cards';
import {Contracts} from './tokenScript/Contracts';
import {Meta} from './tokenScript/Meta';
import {Origin} from './tokenScript/Origin';
import {Selections} from './tokenScript/selection/Selections';
import {Transaction} from './tokenScript/Transaction';
import {IViewBinding} from './view/IViewBinding';
import {ViewController} from './view/ViewController';
import {ViewStyles} from './view/ViewStyles';

import {ScriptInfo} from './repo/sources/SourceInterface';
import {TransactionResponse} from "ethers";

export interface ITokenContext extends ITokenCollection {
  originId: string;
  selectedTokenIndex?: number; // TODO: Deprecate selectedTokenIndex
  selectedTokenId?: string;
}

export interface ITokenIdContext {
  originId: string;
  chainId: number;
  selectedTokenId?: string;
}

export interface TokenScriptEvents {
  TOKENS_UPDATED: TokensUpdatedEventArgs;
  TOKENS_LOADING: void;
  TX_STATUS: ITransactionStatus;
}

export interface TokensUpdatedEventArgs {
  tokens: TokenMetadataMap;
}

export type EventHandler = (data: any) => Promise<void> | void;

export type TokenMetadataMap = { [contractName: string]: ITokenCollection };

export interface ITransactionStatus {
  status: 'started' | 'aborted' | 'submitted' | 'confirmed' | 'completed' | 'error';
  txNumber?: string;
  txLink?: string;
  txRecord?: any;
  message?: string;
  error?: any;
}

export interface ITransactionListener {
  (data: ITransactionStatus): void | Promise<void>;
}

export interface SourceInfo {
  tsId: string;
  source: ScriptSourceType;
  sourceUrl: string;
  scriptInfo: ScriptInfo;
}

export interface ITokenScript {
  readonly viewStyles: ViewStyles;
  readonly transactionValidator: TransactionValidator;
  readonly tokenDef: XMLDocument;
  readonly xmlStr: string;

  getEngine(): ITokenScriptEngine;
  getName(): string | null;
  getXmlString(): string;
  getSourceInfo(): SourceInfo;
  getLabel(pluralQty?: number): string;
  getMetadata(): Meta;
  getOrigins(): { [originName: string]: Origin };
  getContracts(): Contracts;
  getCards(): Cards;
  getAttributes(): Attributes;
  getAttestationDefinitions(): AttestationDefinitions;
  getSelections(): Selections;
  getCurrentTokenContext(): ITokenContext | undefined;
  getTokenContextData(tokenIdContext?: ITokenIdContext): Promise<ITokenContextData>;
  getSecurityInfo(): SecurityInfo;
  getViewContent(name: string): HTMLCollection | null;
  emitEvent<K extends keyof TokenScriptEvents>(eventName: K, data: TokenScriptEvents[K]): void;
  on<
    T extends keyof TokenScriptEvents, // <- T points to a key
    R extends (data: TokenScriptEvents[T]) => Promise<void> | void, // <- R points to the type of that key
  >(
    eventType: T,
    callback: R,
    id?: string,
  ): void;
  off<
    T extends keyof TokenScriptEvents, // <- T points to a key
  >(
    eventType: T,
    id?: string,
  ): void;
  getAsnModuleDefinition(name: string): Element | null;
  executeTransaction(transaction: Transaction, listener?: ITransactionListener, waitForConfirmation?: boolean): Promise<ITransactionStatus | false>;

  // Only for full TokenScript
  getViewController(viewBinding?: IViewBinding): ViewController;
  hasViewBinding(): boolean;
  getViewBinding(): IViewBinding;
  setViewBinding(viewBinding: IViewBinding): void;
  showOrExecuteTokenCard(card: Card, transactionListener?: ITransactionListener): Promise<void>;
  getTokenMetadata(reloadFromAdapter?: boolean, bypassCache?: boolean, alwaysFireEvent?: boolean): Promise<TokenMetadataMap>;
  setTokenMetadata(tokenMetadata: ITokenCollection[]): void;
  resolveTokenMetadata(reload: boolean): Promise<ITokenCollection[]>;
  setCurrentTokenContext(contractName: string, tokenIndex?: number | null, tokenId?: string | null): void;
  unsetTokenContext(): void;
  getTokenOriginData(): ITokenCollection[];
  setTokenDiscoveryAdapter(adapter: ITokenDiscoveryAdapter): void;
}

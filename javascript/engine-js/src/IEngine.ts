import { AttestationManager } from './attestation/AttestationManager';
import { IAttestationStorageAdapter } from './attestation/IAttestationStorageAdapter';
import { ScriptInfo } from './repo/sources/SourceInterface';
import { ITxValidationInfo } from './security/TransactionValidator';
import { TrustedKey } from './security/TrustedKeyResolver';
import { ITokenDiscoveryAdapter } from './tokens/ITokenDiscoveryAdapter';
import { ITokenScript } from './ITokenScript';
import { ILocalStorageAdapter } from './view/data/ILocalStorageAdapter';
import { IWalletAdapter } from './wallet/IWalletAdapter';
import {ITlinkAdapter} from "./tlink/ITlinkAdapter";

export interface IEngineConfig {
  ipfsGateway?: string;
  noLocalStorage?: boolean;
  trustedKeys?: TrustedKey[]; // Define signing keys which are always valid
  txValidationCallback?: (txInfo: ITxValidationInfo) => boolean | Promise<boolean>;
  viewerOrigin?: string;
  tlinkRequestAdapter?: ITlinkAdapter;
}

export enum ScriptSourceType {
  SCRIPT_REGISTRY = 'registry',
  SCRIPT_URI = 'scriptUri',
  URL = 'url',
  UNKNOWN = 'unknown',
}

export interface ITokenScriptEngine {
  getWalletAdapter: () => Promise<IWalletAdapter>;
  readonly config?: IEngineConfig;

  processIpfsUrl(uri: string): string;
  getScriptUris(chain: string | number, contractAddr: string): Promise<string[] | null>;
  getTokenScriptFromUrl(url: string): Promise<ITokenScript>;
  loadTokenScript(xml: string): Promise<ITokenScript>;

  resolveAllScripts(tsPath: string, forceReload?: boolean): Promise<ScriptInfo[]>;

  // Only for full TokenScriptEngine
  getTokenDiscoveryAdapter?: () => Promise<ITokenDiscoveryAdapter>;
  getAttestationStorageAdapter?: () => IAttestationStorageAdapter;
  getLocalStorageAdapter?: () => ILocalStorageAdapter;
  getAttestationManager(): AttestationManager;
  signPersonalMessage(data: string): Promise<string>;
}

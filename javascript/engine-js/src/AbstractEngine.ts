import { IEngineConfig, ITokenScriptEngine } from './IEngine';
import { ITokenScript } from './ITokenScript';
import { Repo } from './repo/Repo';
import { IWalletAdapter } from './wallet/IWalletAdapter';

const DEFAULT_CONFIG: IEngineConfig = {
  ipfsGateway: 'https://smart-token-labs-demo-server.mypinata.cloud/ipfs/',
  noLocalStorage: false,
  trustedKeys: [],
  viewerOrigin: "*"
};

/**
 * Engine.ts is the top level component for the TokenScript engine, it can be used to create a new TokenScript instance
 * via the repo, URL or directly from XML source
 */
export abstract class AbstractTokenScriptEngine implements ITokenScriptEngine {
  protected repo: Repo
  // TODO: Should we pass in a function or a constructor, dunno
  constructor(public getWalletAdapter: () => Promise<IWalletAdapter>, public readonly config?: IEngineConfig) {
    this.repo = new Repo(this)

    if (this.config) {
      this.config = {
        ...DEFAULT_CONFIG,
        ...this.config,
      };
    } else {
      this.config = DEFAULT_CONFIG;
    }
  }

  public resolveAllScripts(tsPath: string, forceReload = false) {
    return this.repo.resolveAllScripts(tsPath, forceReload);
  }

  /**
   * Sign a personal message using the Ethereum WalletAdapter implementation provided by the user-agent
   * @param data
   */
  public async signPersonalMessage(data) {
    try {
      return await (await this.getWalletAdapter()).signPersonalMessage(data);
    } catch (e) {
      throw new Error('Signing failed: ' + e.message);
    }
  }

  // TODO: This should probably be moved somewhere else
  /**
   * Public IPFS gateways are sometimes very slow, so when a custom IPFS gateway is supplied in the config,
   * we update the following URLs to our own gateways.
   * @private
   */
  private IPFS_REPLACE_GATEWAYS = ['ipfs://', 'https://ipfs.io/ipfs/', 'https://gateway.pinata.cloud/ipfs/'];

  public processIpfsUrl(uri: string) {
    for (let gateway of this.IPFS_REPLACE_GATEWAYS) {
      if (this.config.ipfsGateway.indexOf(gateway) === 0) {
        continue;
      }

      if (uri.indexOf(gateway) === 0) {
        uri = uri.replace(gateway, this.config.ipfsGateway);
        break;
      }
    }

    return uri;
  }

  public abstract getTokenScriptFromUrl(url: string): Promise<ITokenScript>;
  public abstract loadTokenScript(xml: string): Promise<ITokenScript>;
  public abstract getTokenDiscoveryAdapter?: () => Promise<any>;
  public abstract getAttestationStorageAdapter?: () => any;
  public abstract getLocalStorageAdapter?: () => any;
  public abstract getAttestationManager(): any;
}

import { AbstractTokenScriptEngine } from './AbstractEngine';
import { IEngineConfig, ScriptSourceType } from './IEngine';
import { LiteTokenScript } from './LiteTokenScript';
import { ScriptInfo } from './repo/sources/SourceInterface';
import { IWalletAdapter } from './wallet/IWalletAdapter';

/**
 * This is a lightweight version of the TokenScript engine
 * Additional dependencies that are used for token discovery and token rendering are not included
 */
export class LiteTokenScriptEngine extends AbstractTokenScriptEngine {
  // TODO: Should we pass in a function or a constructor, dunno
  constructor(getWalletAdapter: () => Promise<IWalletAdapter>, config?: IEngineConfig) {
    super(getWalletAdapter, config);
  }

  /**
   * Create a new TokenScript instance from a repo source
   * @param sourceId The unique identifier for the TokenScript file
   * @param forceRefresh Bypass resolver cache and re-resolve this contracts TokenScripts
   */
  public async getTokenScript(sourceId: string, forceRefresh = false) {
    const resolveResult = await this.repo.getTokenScript(sourceId, forceRefresh);

    const { xml, ...sourceInfo } = resolveResult;

    return await this.initializeTokenScriptObject(resolveResult.xml, resolveResult.type, resolveResult.sourceId, resolveResult.sourceUrl, sourceInfo);
  }

  /**
   * Create a new TokenScript instance from a URL source
   * @param url Source URL for the TokenScript
   */
  public async getTokenScriptFromUrl(url: string) {
    url = this.processIpfsUrl(url);

    // TODO: Add caching for URL loaded tokenscripts, add URL source to repo
    const res = await fetch(url, {
      cache: 'no-store',
    });

    if (res.status < 200 || res.status > 399) {
      throw new Error('Failed to load URL: ' + res.statusText);
    }

    let tsType: ScriptSourceType = ScriptSourceType.URL;

    return await this.initializeTokenScriptObject(await res.text(), tsType, url, url, null);
  }

  // TODO: The engine should hold the tokenscript object in memory until explicitly cleared, or done so via some intrinsic.
  //		This will allow TokenScripts to call other TokeScripts via their external API
  /**
   * Create a new TokenScript instance from raw XML
   * @param xml XML string
   * @param sourceType
   * @param sourceId
   * @param sourceUrl
   */
  public async loadTokenScript(xml: string) {
    return await this.initializeTokenScriptObject(xml, ScriptSourceType.UNKNOWN, undefined, undefined, undefined);
  }

  /**
   * Instantiate a new TokenScript object
   * @param xml
   * @param source
   * @param sourceId
   * @param sourceUrl
   * @param scriptInfo
   * @private
   */
  private async initializeTokenScriptObject(xml: string, source: ScriptSourceType, sourceId: string, sourceUrl?: string, scriptInfo?: ScriptInfo) {
    try {
      // Only support browser env for token-kit usage for now
      const parser = new DOMParser();
      let tokenXml = parser.parseFromString(xml, 'text/xml');

      return new LiteTokenScript(this, tokenXml, xml, source, sourceId, sourceUrl, scriptInfo);
    } catch (e) {
      throw new Error('Failed to parse tokenscript definition: ' + e.message);
    }
  }

  // Not implemented for LiteTokenScriptEngine
  public getTokenDiscoveryAdapter: () => Promise<any> = () => {
    throw new Error('LiteTokenScriptEngine does not support the operation');
  };
  public getAttestationStorageAdapter: () => any = () => {
    throw new Error('LiteTokenScriptEngine does not support the operation');
  };
  public getLocalStorageAdapter: () => any = () => {
    throw new Error('LiteTokenScriptEngine does not support the operation');
  };
  public getAttestationManager(): any {
    throw new Error('LiteTokenScriptEngine does not support the operation');
  }
}

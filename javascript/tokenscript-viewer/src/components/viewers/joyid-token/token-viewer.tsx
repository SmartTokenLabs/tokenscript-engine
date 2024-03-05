import { Component, Event, EventEmitter, h, Host, JSX, Prop, State } from '@stencil/core';
import { AppRoot, ShowToastEventArgs } from '../../app/app';
import { TokenScript } from '@tokenscript/engine-js/src/TokenScript';
import { ITokenDetail } from '@tokenscript/engine-js/src/tokens/ITokenDetail';
import { ITokenCollection } from '@tokenscript/engine-js/src/tokens/ITokenCollection';
import { ITokenDiscoveryAdapter } from '@tokenscript/engine-js/src/tokens/ITokenDiscoveryAdapter';
import { SLNAdapter } from '../../../integration/slnAdapter';
import { zipAndEncodeToBase64 } from '@tokenscript/engine-js/src/attestation/AttestationUrl';
import { ISLNAttestation } from '@tokenscript/engine-js/src/attestation/ISLNAdapter';
import { ethers } from 'ethers';
import { SchemaDecodedItem, SchemaEncoder, SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
import { IFrameProvider } from './iframe-provider';

const SLN_CHAIN_IDS = [1337, 82459, 5169];
@Component({
  tag: 'token-viewer',
  styleUrl: 'token-viewer.css',
  shadow: false,
  scoped: false,
})
export class TokenViewer {
  @Prop()
  app: AppRoot;

  @State()
  tokenDetails: ITokenDetail;

  @State()
  BASE_URL: string;

  @State()
  isAttestation: boolean;

  @State()
  slnAttestation: ISLNAttestation;

  @State()
  decoded: any;

  @State()
  tokenScript: TokenScript;

  @State()
  iframeProvider: IFrameProvider;

  urlRequest: URLSearchParams;

  @State() cardButtons: JSX.Element[] | undefined;

  @State() actionsEnabled = true;

  @Event({
    eventName: 'showToast',
    composed: true,
    cancelable: true,
    bubbles: true,
  })
  showToast: EventEmitter<ShowToastEventArgs>;

  @Event({
    eventName: 'showLoader',
    composed: true,
    cancelable: true,
    bubbles: true,
  })
  showLoader: EventEmitter<void>;

  @Event({
    eventName: 'hideLoader',
    composed: true,
    cancelable: true,
    bubbles: true,
  })
  hideLoader: EventEmitter<void>;

  async componentWillLoad() {
    try {
      const query = new URLSearchParams(document.location.search.substring(1));
      const hashQuery = new URLSearchParams(document.location.hash.substring(1));

      for (const [key, param] of hashQuery.entries()) {
        query.set(key, param);
      }

      this.urlRequest = query;

      await this.processUrlLoad();
    } catch (e) {
      console.error(e);
      this.showToast.emit({
        type: 'error',
        title: 'Failed to load token details',
        description: e.message,
      });
    }
  }

  async processUrlLoad() {
    const queryStr = document.location.search.substring(1);

    if (!queryStr) return false;

    const query = new URLSearchParams(queryStr);

    if (query.has('chain') && query.has('contract') && query.has('tokenId')) {
      const chain = parseInt(query.get('chain'));
      const contract = query.get('contract');
      const tokenId = query.get('tokenId');

      if (SLN_CHAIN_IDS.includes(chain)) {
        this.isAttestation = true;

        this.app.showTsLoader();

        const slnAdapter = new SLNAdapter(chain);
        this.slnAttestation = await slnAdapter.getAttestation(contract, tokenId, chain.toString());

        if (!this.slnAttestation) {
          console.log('No Attestation!');
          return;
        }
        console.log(this.slnAttestation.rawData);
        const rawData = this.slnAttestation.rawData;
        const attestation = zipAndEncodeToBase64({ sig: rawData, signer: contract });

        console.log('Attestation loaded!');

        this.app.hideTsLoader();

        const params = new URLSearchParams();
        params.set('attestation', attestation);
        params.set('type', 'eas');
        console.log('rawData.uid--', rawData.uid);
        this.decoded = this.decodeData(await this.getSchemaSignature(rawData.message.schema), rawData.message.data);
        console.log(this.decoded.formatted.scriptURI);

        // TODO: only for testing, remove later this as SLN attestation will embed scriptURI

        //params.set('scriptURI', 'http://localhost:3333/assets/tokenscripts/tokenscript.tsml');
        this.BASE_URL = new URL(this.decoded.formatted.scriptURI).origin;
        this.loadIframe(this.decoded.formatted.scriptURI);
      } else {
        this.isAttestation = false;

        console.log('####');
        if (query.get('actionsEnabled') === 'false') this.actionsEnabled = false;

        this.app.showTsLoader();

        // this.tokenDetails = await getSingleTokenMetadata(chain, contract, tokenId);

        console.log('Token meta loaded!', this.tokenDetails);

        this.app.hideTsLoader();

        this.loadTokenScript();
      }

      return true;
    }

    throw new Error('Could not locate token details using the values provided in the URL');
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);

  schemaReg: SchemaRegistry = new SchemaRegistry('0x55D26f9ae0203EF95494AE4C170eD35f4Cf77797');

  private async getSchemaSignature(uid: string) {
    this.schemaReg.connect(this.provider);
    const schema = await this.schemaReg.getSchema({ uid });
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

  private async loadTokenScript() {
    try {
      const chain: number = parseInt(this.urlRequest.get('chain'));
      const contract: string = this.urlRequest.get('contract');
      const tsId = chain + '-' + contract;
      const tokenScript = await this.app.loadTokenscript('resolve', tsId);

      const origins = tokenScript.getTokenOriginData();
      let selectedOrigin;

      for (const origin of origins) {
        if (origin.chainId === chain && contract.toLowerCase() === contract.toLowerCase()) {
          selectedOrigin = origin;
          origin.tokenDetails = [this.tokenDetails];
          break;
        }
      }

      if (selectedOrigin) {
        tokenScript.setTokenMetadata(origins);

        class StaticDiscoveryAdapter implements ITokenDiscoveryAdapter {
          getTokens(initialTokenDetails: ITokenCollection[], refresh: boolean): Promise<ITokenCollection[]> {
            return Promise.resolve(origins);
          }
        }

        this.app.discoveryAdapter = new StaticDiscoveryAdapter();

        tokenScript.setCurrentTokenContext(selectedOrigin.originId, 0);
        this.tokenScript = tokenScript;
      }
    } catch (e) {
      console.warn(e.message);
    }
  }

  private async loadIframe(url: string) {
    setTimeout(() => {
      const iFrame = document.getElementById('frame');
      if (iFrame) {
        (document.getElementById('frame') as any).src = url;
        //this.handleMessage();
        console.log('####', iFrame);
        this.iframeProvider = new IFrameProvider({
          iframeRef: iFrame as HTMLIFrameElement,
          provider: new ethers.providers.Web3Provider(window.ethereum),
          type: 'ethereum',
          targetOrigin: this.BASE_URL,
        });
        console.log;
      }
    }, 1000);
  }

  private async loadAttestationAndTokenScript(params: URLSearchParams, chain: number) {
    const { tokenScript } = await this.app.tsEngine.importAttestationUsingTokenScript(params);

    const tokenMetadata = await tokenScript.getTokenMetadata();
    const updatedTokenMetadata = [];
    for (const [attName, metadata] of Object.entries(tokenMetadata)) {
      if (attName === 'SLNAttestation') {
        updatedTokenMetadata.push({
          ...metadata,
          chainId: chain,
        });
      } else {
        updatedTokenMetadata.push(metadata);
      }
    }
    tokenScript.setTokenMetadata(updatedTokenMetadata);

    this.tokenScript = tokenScript;
  }

  iframeLoadListener(attestation: ISLNAttestation, decoded: any) {
    console.log('##load', attestation.rawData, window.parent);
    const src = (document.getElementById('frame') as any).src;
    console.log('src', src, this.iframeProvider);
    if (src && this.iframeProvider) {
      console.log('this.iframeProvider--', this.iframeProvider);
      this.iframeProvider.sendResponse({ attestation: attestation.rawData, type: 'attestation' }, null, {});
      this.iframeProvider.sendResponse(decoded.formatted, null, {});
    }
  }

  render() {
    return (
      <Host>
        <div class="token-viewer">
          {!this.isAttestation && this.tokenDetails && (
            <div>
              <div class="details-container">
                <div class="image-container">
                  <token-icon style={{ minHeight: '100px;' }} src={this.tokenDetails.image} imageTitle={this.tokenDetails.name} />
                </div>
                <div class="info-container">
                  <div class="main-info">
                    <h1>{this.tokenDetails.name}</h1>
                    <div class="owner-count">
                      <span style={{ color: '#3D45FB' }}>
                        {this.tokenDetails.collectionDetails.tokenType === 'erc1155' ? 'balance: ' + this.tokenDetails.balance : '#' + this.tokenDetails.tokenId}
                      </span>
                    </div>
                    <div class="collection-details">
                      <token-icon
                        style={{ width: '24px', borderRadius: '4px' }}
                        src={this.tokenDetails.collectionDetails.image}
                        imageTitle={this.tokenDetails.collectionDetails.name}
                      />
                      <h4>{this.tokenDetails.collectionDetails.name ?? this.tokenDetails.name}</h4>
                      <span>{this.tokenDetails.collectionDetails.tokenType.toUpperCase()}</span>
                    </div>
                  </div>
                  <div class="extra-info">
                    <p>{this.tokenDetails.description}</p>
                    <div class="attribute-container">
                      {this.tokenDetails.attributes?.length
                        ? this.tokenDetails.attributes.map(attr => {
                            return (
                              <div class="attribute-item" title={attr.trait_type + ': ' + attr.value}>
                                <h5>{attr.trait_type}</h5>
                                <span>{attr.value}</span>
                              </div>
                            );
                          })
                        : ''}
                    </div>
                  </div>
                </div>
              </div>
              <action-bar engine={this.app.tsEngine} tokenDetails={this.tokenDetails} tokenScript={this.tokenScript} actionsEnabled={this.actionsEnabled} />
            </div>
          )}
          {this.isAttestation && this.tokenScript && (
            <div>
              <div class="meta-details">
                {this.tokenScript.getMetadata().description ? <p>{this.tokenScript.getMetadata().description}</p> : ''}
                {this.tokenScript.getMetadata().aboutUrl ? (
                  <a href={this.tokenScript.getMetadata().aboutUrl} target="_blank">
                    {'Discover how it works'}
                    <img alt="about" src="/assets/icon/question.svg" />
                  </a>
                ) : (
                  ''
                )}
              </div>
              <tokens-grid tokenScript={this.tokenScript}></tokens-grid>
            </div>
          )}
          {this.isAttestation && !this.tokenScript && (
            <iframe src="" class="iframe-viewer" id="frame" onLoad={() => this.iframeLoadListener(this.slnAttestation, this.decoded)} frameBorder={0} />
          )}
        </div>
        <card-popover tokenScript={this.tokenScript}></card-popover>
      </Host>
    );
  }
}

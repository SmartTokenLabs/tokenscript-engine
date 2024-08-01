import {Component, Event, EventEmitter, h, Host, JSX, Prop, State} from '@stencil/core';
import {AppRoot, ShowToastEventArgs} from '../../app/app';
import {TokenScript} from '@tokenscript/engine-js/src/TokenScript';
import {ITokenDetail} from '@tokenscript/engine-js/src/tokens/ITokenDetail';
import {getSingleTokenMetadata} from '../util/getSingleTokenMetadata';
import {getHardcodedDescription} from '../util/getHardcodedDescription';
import {SLNAdapter} from '../../../integration/slnAdapter';
import {ISLNAttestation} from '@tokenscript/engine-js/src/attestation/ISLNAdapter';
import {Provider} from 'ethers';
import {IFrameProvider} from '../../../providers/iframeProvider';
import {EthersAdapter} from '@tokenscript/engine-js/src/wallet/EthersAdapter';
import {getTokenUrlParams} from "../util/getTokenUrlParams";
import {getTokenScriptWithSingleTokenContext} from "../util/getTokenScriptWithSingleTokenContext";
import {previewAddr} from "@tokenscript/engine-js/src/utils";
import {connectEmulatorSocket} from "../util/connectEmulatorSocket";

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
	provider: Provider;

	@State()
	iframeProvider: IFrameProvider;

	@State()
	description: string = '';

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

	async componentDidLoad() {
		try {
			const walletAdapter = await this.app.getWalletAdapter() as EthersAdapter
			this.provider = await walletAdapter.getWalletEthersProvider();

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

		let {query, chain, contract, tokenId, tokenscriptUrl, emulator} = getTokenUrlParams();

		if (!tokenId)
			throw new Error('Token ID was not provided in the URL');

		const slnAdapter = new SLNAdapter();
		this.slnAttestation = await slnAdapter.getAttestation(contract, tokenId, chain.toString())

		if (this.slnAttestation) {
			this.isAttestation = true;

			this.app.showTsLoader();

			this.decoded = await slnAdapter.decodeAttestation(this.slnAttestation.rawData, this.provider);

			this.app.hideTsLoader();

			console.log(this.decoded.formatted.scriptURI);
			this.BASE_URL = new URL(this.decoded.formatted.scriptURI).origin;
			this.loadIframe(this.decoded.formatted.scriptURI);
		} else {
			this.isAttestation = false;
			if (query.get('actionsEnabled') === 'false') this.actionsEnabled = false;

			this.app.showTsLoader();

			const res = await getSingleTokenMetadata(chain, contract, tokenId, this.app.tsEngine);
			this.tokenDetails = res.detail;

			console.log('Token meta loaded!', this.tokenDetails);

			this.app.hideTsLoader();

			if (emulator){
				const emulatorUrl = new URL(decodeURIComponent(emulator)).origin;
				tokenscriptUrl = emulatorUrl + "/tokenscript.tsml";
				connectEmulatorSocket(emulatorUrl, async() => {
					await this.loadTokenScript(chain, contract, tokenId, tokenscriptUrl);
				});
			}

			this.loadTokenScript(chain, contract, tokenId, tokenscriptUrl);
		}
	}

	private async loadTokenScript(chain: number, contract: string, tokenId: string, tokenScriptUrl?: string) {
		try {
			this.tokenScript = await getTokenScriptWithSingleTokenContext(this.app, chain, contract, this.tokenDetails.collectionDetails, this.tokenDetails, tokenId, tokenScriptUrl);
			this.description = await getHardcodedDescription(this.tokenScript, this.tokenDetails);
		} catch (e) {
			console.warn(e.message);
			this.showToast.emit({
				type: 'error',
				title: "Failed to load TokenScript",
				description: e.message
			});
			this.description = this.tokenDetails.description;
		}
	}

	private async loadIframe(url: string) {
		setTimeout(() => {
			const iFrame = document.getElementById('frame');
			if (iFrame) {
				(document.getElementById('frame') as any).src = url;
				this.iframeProvider = new IFrameProvider({
					iframeRef: iFrame as HTMLIFrameElement,
					provider: this.provider,
					type: 'ethereum',
					targetOrigin: this.BASE_URL,
					onPageReady: () => this.iframeLoadListener(this.slnAttestation, this.decoded)
				});
			}
		}, 1000);
	}

	iframeLoadListener(attestation: ISLNAttestation, decoded: any) {
		const src = (document.getElementById('frame') as any).src;
		if (src && this.iframeProvider) {
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
									<token-icon style={{ minHeight: '100px;' }} src={(this.tokenScript && this.tokenScript.getMetadata().imageUrl) ?
										this.tokenScript.getMetadata().imageUrl :
										(this.tokenDetails?.image ?? this.tokenDetails?.collectionDetails?.image ?? (this.tokenScript ? this.tokenScript.getMetadata().iconUrl : null))
									} imageTitle={this.tokenDetails?.name ?? this.tokenDetails?.collectionDetails.name} />
								</div>
								<div class="info-container">
									<div class="main-info">
										<div class="title-row">
											<div class="title-container">
												<h1 title={this.tokenDetails.name}>
													{previewAddr(this.tokenDetails.name)}
													{this.tokenDetails ? <copy-icon copyText={this.tokenDetails.tokenId}/> : ''}
												</h1>
												<div class="owner-count">
													<span style={{ color: '#3D45FB' }}>
														{this.tokenDetails.collectionDetails.tokenType === 'erc1155' ?
															'balance: ' + this.tokenDetails.balance :
															'#' + previewAddr(this.tokenDetails.tokenId)}
													</span>
												</div>
											</div>
											<div class="security-wrapper">{this.tokenScript ? <security-status tokenScript={this.tokenScript} size="small" /> : ''}</div>
										</div>
										<div class="collection-details">
											<token-icon
												style={{ width: '24px', borderRadius: '4px' }}
												src={this.tokenDetails.collectionDetails.image ?? (this.tokenScript ? this.tokenScript.getMetadata().iconUrl : null)}
												imageTitle={this.tokenDetails.collectionDetails.name}
											/>
											<h4>{this.tokenDetails.collectionDetails.name}</h4>
											<span>{this.tokenDetails.collectionDetails.tokenType.toUpperCase()}</span>
										</div>
									</div>
									<div class="extra-info">
										<p innerHTML={(this.description ?? "").replace(/\n/g, '<br/>')}></p>
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
					{this.isAttestation && <iframe src="" class="iframe-viewer" id="frame" frameBorder={0} />}
				</div>
				<card-popover tokenScript={this.tokenScript}></card-popover>
			</Host>
		);
	}
}

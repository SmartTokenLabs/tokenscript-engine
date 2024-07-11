import { Component, Event, EventEmitter, h, Host, JSX, Prop, State } from '@stencil/core';
import { AppRoot, ShowToastEventArgs } from '../../app/app';
import { ITransactionStatus, TokenScript } from '@tokenscript/engine-js/src/TokenScript';
import { ITokenDetail } from '@tokenscript/engine-js/src/tokens/ITokenDetail';
import { ITokenCollection } from '@tokenscript/engine-js/src/tokens/ITokenCollection';
import { getSingleTokenMetadata } from '../util/getSingleTokenMetadata';
import { Card } from '@tokenscript/engine-js/src/tokenScript/Card';
import { handleTransactionError, showTransactionNotification } from '../util/showTransactionNotification';
import { getCardButtonClass } from '../util/getCardButtonClass';
import { getHardcodedDescription } from '../util/getHardcodedDescription';
import { ISLNAttestation } from '@tokenscript/engine-js/src/attestation/ISLNAdapter';
import { Provider } from 'ethers';
import { IFrameProvider } from '../../../providers/iframeProvider';
import { SLNAdapter } from '../../../integration/slnAdapter';
import { EthersAdapter } from '../../../../../engine-js/src/wallet/EthersAdapter';
import { EthUtils } from '../../../../../engine-js/src/ethereum/EthUtils';
import { getTokenUrlParams } from '../util/getTokenUrlParams';
import { getTokenScriptWithSingleTokenContext } from '../util/getTokenScriptWithSingleTokenContext';
import { previewAddr } from '@tokenscript/engine-js/src/utils';
import { connectEmulatorSocket } from '../util/connectEmulatorSocket';

@Component({
	tag: 'sts-viewer',
	styleUrl: 'sts-viewer.css',
	shadow: false,
	scoped: false,
})
export class SmartTokenStoreViewer {
	@Prop()
	app: AppRoot;

	@State()
	collectionDetails: ITokenCollection;

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

	urlRequest: URLSearchParams;

	@State() cardButtons: JSX.Element[] | undefined;

	@State() overflowCardButtons: JSX.Element[];

	@State()
	fullWidth: boolean = false;

	private fungible = false;

	private overflowDialog: HTMLActionOverflowModalElement;

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
		const params = new URLSearchParams(document.location.search);
		this.fullWidth = params.get('fullWidth') === 'true';
		try {
			const walletAdapter = (await this.app.getWalletAdapter()) as EthersAdapter;
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
		let { chain, contract, tokenId, tokenscriptUrl, wallet, emulator } = getTokenUrlParams();

		let slnAdapter;

		try {
			if (tokenId) {
				slnAdapter = new SLNAdapter();
				this.slnAttestation = await slnAdapter.getAttestation(contract, tokenId, chain.toString());
			}

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
				this.app.showTsLoader();

				const res = await getSingleTokenMetadata(chain, contract, tokenId, this.app.tsEngine, wallet);
				this.tokenDetails = res.detail;
				this.collectionDetails = res.collection;

				console.log('Token meta loaded!', this.collectionDetails, this.tokenDetails);
				this.app.hideTsLoader();

				if (emulator) {
					const emulatorUrl = new URL(decodeURIComponent(emulator)).origin;
					tokenscriptUrl = emulatorUrl + '/tokenscript.tsml';
					connectEmulatorSocket(emulatorUrl, async () => {
						await this.loadTokenScript(chain, contract, tokenId, tokenscriptUrl);
					});
				}

				await this.loadTokenScript(chain, contract, tokenId, tokenscriptUrl);
			}
		} catch (e) {
			console.error(e);
			this.app.hideTsLoader();
			this.showToast.emit({
				type: 'error',
				title: 'Failed to process URL',
				description: e.message,
			});
		}
	}

	private async loadTokenScript(chain: number, contract: string, tokenId: string, tokenScriptUrl?: string) {
		try {
			this.tokenScript = await getTokenScriptWithSingleTokenContext(this.app, chain, contract, this.collectionDetails, this.tokenDetails, tokenId, tokenScriptUrl);

			if (this.tokenScript.getMetadata().backgroundImageUrl) {
				const body = document.getElementsByTagName('body')[0];
				body.classList.add('ts-token-background');
				body.style.backgroundImage = `url(${this.tokenScript.getMetadata().backgroundImageUrl})`;
			}

			// Reload cards after the token is updated
			this.tokenScript.on(
				'TOKENS_UPDATED',
				data => {
					this.cardButtons = null;
					this.overflowCardButtons = null;
					this.loadCards();
				},
				'grid',
			);

			this.loadCards();
		} catch (e) {
			console.error(e);
			this.showToast.emit({
				type: 'error',
				title: 'Failed to load TokenScript',
				description: e.message,
			});
		}
	}

	private async loadIframe(url: string) {
		setTimeout(() => {
			try {
				const iFrame = document.getElementById('frame');
				if (iFrame) {
					(iFrame as any).src = url;
					this.iframeProvider = new IFrameProvider({
						iframeRef: iFrame as HTMLIFrameElement,
						provider: this.provider,
						type: 'ethereum',
						targetOrigin: this.BASE_URL,
						onPageReady: () => this.iframeLoadListener(this.slnAttestation, this.decoded),
					});
				}
			} catch (e) {
				console.error(e);
				this.showToast.emit({
					type: 'error',
					title: 'Failed to load iframe',
					description: e.message,
				});
			}
		}, 1000);
	}

	iframeLoadListener(attestation: ISLNAttestation, decoded: any) {
		try {
			const src = (document.getElementById('frame') as any).src;
			if (src && this.iframeProvider) {
				this.iframeProvider.sendResponse({ attestation: attestation.rawData, type: 'attestation' }, null, {});
				this.iframeProvider.sendResponse(decoded.formatted, null, {});
			}
		} catch (e) {
			console.error(e);
			this.showToast.emit({
				type: 'error',
				title: 'Failed to load iframe listener',
				description: e.message,
			});
		}
	}

	private async loadCards() {
		try {
			const cardButtons: JSX.Element[] = [];
			const overflowCardButtons: JSX.Element[] = [];

			const cards = this.tokenScript.getCards();

			for (let [index, card] of cards.entries()) {
				let label = card.label;

				if (label === 'Unnamed Card') label = card.type === 'token' ? 'Token Info' : card.type + ' Card';

				try {
					const enabled = await card.isEnabledOrReason();

					if (enabled === false) continue;

					const cardElem = (
						<button
							class={'ts-card-button btn ' + getCardButtonClass(card, index)}
							onClick={() => this.showCard(card)}
							disabled={enabled !== true}
							title={enabled !== true ? enabled : label}
						>
							<span>{label}</span>
						</button>
					);

					if (enabled !== true || cardButtons.length > 2) {
						overflowCardButtons.push(cardElem);
					} else {
						cardButtons.push(cardElem);
					}
				} catch (e) {
					console.error('Failed to check if card is available', e);
				}
			}

			this.cardButtons = cardButtons;
			this.overflowCardButtons = overflowCardButtons;
			this.description = this.tokenDetails ? await getHardcodedDescription(this.tokenScript, this.tokenDetails) : this.collectionDetails.description ?? '';
		} catch (e) {
			console.error(e);
			this.showToast.emit({
				type: 'error',
				title: 'Failed to load cards',
				description: e.message,
			});
		}
	}

	private async showCard(card: Card) {
		this.showLoader.emit();

		try {
			await this.tokenScript.showOrExecuteTokenCard(card, async (data: ITransactionStatus) => {
				if (data.status === 'started') this.showLoader.emit();

				if (data.status === 'confirmed') this.hideLoader.emit();

				await showTransactionNotification(data, this.showToast);
			});
		} catch (e) {
			console.error(e);
			handleTransactionError(e, this.showToast);
		}

		this.hideLoader.emit();
	}

	render() {
		return (
			<Host>
				<style innerHTML={this.tokenScript ? this.tokenScript.viewStyles.getViewCss() : ''} />
				<div class={'ts-token-container token-viewer ' + (this.fullWidth ? 'full-width' : '')}>
					{!this.isAttestation && this.tokenScript && (
						<div>
							<div class="details-container">
								<div class="image-container">
									<token-icon
										style={{ minHeight: '100px;' }}
										src={
											this.tokenScript && this.tokenScript.getMetadata().imageUrl
												? this.tokenScript.getMetadata().imageUrl
												: this.tokenDetails?.image ?? this.collectionDetails.image ?? (this.tokenScript ? this.tokenScript.getMetadata().iconUrl : null)
										}
										imageTitle={this.tokenDetails?.name ?? this.collectionDetails.name}
									/>
								</div>
								<div class="info-container">
									<div class="main-info">
										<h1 class="token-title" title={this.tokenDetails?.name ?? this.collectionDetails.name}>
											{previewAddr(this.tokenDetails?.name ?? this.collectionDetails.name)}
											{this.tokenDetails ? <copy-icon copyText={this.tokenDetails.tokenId} /> : ''}
										</h1>
										<div class="owner-count">
											<span style={{ color: '#3D45FB' }}>
												{this.collectionDetails.tokenType === 'erc20'
													? 'balance: ' + EthUtils.calculateDecimalValue(this.collectionDetails.balance, this.collectionDetails.decimals)
													: this.collectionDetails.tokenType !== 'erc721'
														? 'balance: ' + (this.tokenDetails?.balance ?? this.collectionDetails.balance ?? 0)
														: '#' + previewAddr(this.tokenDetails.tokenId)}
											</span>
										</div>
										<div class="collection-details">
											<token-icon style={{ width: '24px', borderRadius: '4px' }} src={this.collectionDetails.image} imageTitle={this.collectionDetails.name} />
											<h4>{this.collectionDetails.name}</h4>
											<span>{this.collectionDetails.tokenType.toUpperCase()}</span>
										</div>
									</div>
									<div class="extra-info">
										<p innerHTML={this.description && this.description.replace(/\n/g, '<br/>')}></p>
										<div class="attribute-container">
											{this.tokenDetails?.attributes?.length
												? this.tokenDetails?.attributes.map(attr => {
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
							<div class="actions">
								{this.cardButtons ? this.cardButtons : <loading-spinner color={'#595959'} size={'small'} style={{ textAlign: 'center' }} />}
								{this.overflowCardButtons?.length
									? [
										<button class="btn more-actions-btn ts-overflow-button" onClick={() => this.overflowDialog.openDialog()}>
											+ More actions
										</button>,
										<action-overflow-modal ref={el => (this.overflowDialog = el as HTMLActionOverflowModalElement)}>
											<div class="actions">{this.overflowCardButtons}</div>
										</action-overflow-modal>,
									]
									: ''}
							</div>
							<div style={{ padding: '0 10px 10px 10px' }}>{this.tokenScript ? <security-status tokenScript={this.tokenScript} /> : ''}</div>
						</div>
					)}
					{this.isAttestation && <iframe src="" class="iframe-viewer" id="frame" frameBorder={0} />}
				</div>
				<card-popover tokenScript={this.tokenScript}></card-popover>
			</Host>
		);
	}
}

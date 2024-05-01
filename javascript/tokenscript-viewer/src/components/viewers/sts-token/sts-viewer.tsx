import {Component, Event, EventEmitter, h, Host, JSX, Prop, State} from "@stencil/core";
import {AppRoot, ShowToastEventArgs} from "../../app/app";
import {ITransactionStatus, TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {ITokenDiscoveryAdapter} from "@tokenscript/engine-js/src/tokens/ITokenDiscoveryAdapter";
import {getSingleTokenMetadata} from "../util/getSingleTokenMetadata";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {handleTransactionError, showTransactionNotification} from "../util/showTransactionNotification";
import {getCardButtonClass} from "../util/getCardButtonClass";
import {getHardcodedDescription} from "../util/getHardcodedDescription";
import {ISLNAttestation} from "@tokenscript/engine-js/src/attestation/ISLNAdapter";
import {Provider} from "ethers";
import {IFrameProvider} from "../../../providers/iframeProvider";
import {SLNAdapter} from "../../../integration/slnAdapter";
import {EthersAdapter} from "../../../../../engine-js/src/wallet/EthersAdapter";
import {EthUtils} from "../../../../../engine-js/src/ethereum/EthUtils";

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

	async componentDidLoad(){
		const params = new URLSearchParams(document.location.search);
		this.fullWidth = params.get("fullWidth") === "true";
		try {
			const query = new URLSearchParams(document.location.search.substring(1));
			const hashQuery = new URLSearchParams(document.location.hash.substring(1));

			for (const [key, param] of hashQuery.entries()) {
				query.set(key, param);
			}

			this.urlRequest = query;
			const walletAdapter = (await this.app.getWalletAdapter()) as EthersAdapter
			this.provider = await walletAdapter.getWalletEthersProvider();

			await this.processUrlLoad();
		} catch (e) {
			console.error(e);
			this.showToast.emit({
				type: 'error',
				title: "Failed to load token details",
				description: e.message
			});
		}
	}

	async processUrlLoad() {
		const queryStr = document.location.search.substring(1);

		if (!queryStr) return false;

		const query = new URLSearchParams(queryStr);

		if (query.has('chain') && query.has('contract')) {
			const chain = parseInt(query.get('chain'));
			const contract = query.get('contract');
			let tokenId = query.get('tokenId');

			if (tokenId && tokenId.toLowerCase() === "erc20")
				tokenId = null;

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
				this.app.showTsLoader();

				const res = await getSingleTokenMetadata(chain, contract, tokenId, this.app.tsEngine);
				this.collectionDetails = res.collection;
				this.tokenDetails = res.detail;

				console.log('Token meta loaded!', this.collectionDetails);

				this.app.hideTsLoader();

				this.loadTokenScript();
			}

			return true;
		}

		throw new Error("Could not locate token details using the values provided in the URL");
	}

	private async loadTokenScript() {
		try {
			const chain: number = parseInt(this.urlRequest.get("chain"));
			const contract: string = this.urlRequest.get("contract");
			let tokenScript: TokenScript;

			if (this.urlRequest.has("tokenscriptUrl")) {
				// TODO: Remove this fix once AlphaWallet is updated to support embedded TS viewer for newer schema versions
				let uri = this.urlRequest.get("tokenscriptUrl");
				if (uri === "https://viewer.tokenscript.org/assets/tokenscripts/smart-cat-prod.tsml"){
					console.log("SmartCat tokenscript detected, using updated version for newer features and better performance");
					uri = "/assets/tokenscripts/smart-cat-prod-2024-01.tsml";
				} else if (uri === "https://viewer-staging.tokenscript.org/assets/tokenscripts/smart-cat-mumbai.tsml"){
					console.log("SmartCat tokenscript detected, using updated version for newer features and better performance");
					uri = "/assets/tokenscripts/smart-cat-mumbai-2024-01.tsml";
				}
				tokenScript = await this.app.loadTokenscript("url", uri);
			} else {
				const tsId = chain + "-" + contract;
				tokenScript = await this.app.loadTokenscript("resolve", tsId);
			}

			const origins = tokenScript.getTokenOriginData();
			let selectedOrigin;

			for (const [key, origin] of origins.entries()){
				if (origin.chainId === chain && contract.toLowerCase() === contract.toLowerCase()){
					origins[key] = {
						...this.collectionDetails,
						...origin
					}
					selectedOrigin = origin;
					if (this.tokenDetails)
						origin.tokenDetails = [this.tokenDetails];
					break;
				}
			}

			if (selectedOrigin){

				if (tokenScript.getMetadata().backgroundImageUrl){
					document.getElementsByTagName("body")[0].style.backgroundImage = `url(${tokenScript.getMetadata().backgroundImageUrl})`;
				}

				tokenScript.setTokenMetadata(origins);

				class StaticDiscoveryAdapter implements ITokenDiscoveryAdapter {
					getTokens(initialTokenDetails: ITokenCollection[], refresh: boolean): Promise<ITokenCollection[]> {
						return Promise.resolve(origins);
					}
				}

				this.app.discoveryAdapter = new StaticDiscoveryAdapter();

				tokenScript.setCurrentTokenContext(selectedOrigin.originId, selectedOrigin.tokenType !== "erc20" ? 0 : null);
				this.tokenScript = tokenScript;

				// Reload cards after the token is updated
				this.tokenScript.on("TOKENS_UPDATED", (data) => {
					this.cardButtons = null;
					this.overflowCardButtons = null;
					this.loadCards();
				}, "grid")

				this.loadCards();
			}

		} catch (e){
			console.warn(e.message);
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

	// TODO: Deduplicate logic in common/tokens-grid-item.tsx & viewers/joyid-token/action-bar.tsx
	private async loadCards(){

		const cardButtons: JSX.Element[] = [];
		const overflowCardButtons: JSX.Element[] = [];

		const cards = this.tokenScript.getCards();

		for (let [index, card] of cards.entries()){

			let label = card.label;

			if (label === "Unnamed Card")
				label = card.type === "token" ? "Token Info" : card.type + " Card";

			try {
				const enabled = await card.isEnabledOrReason();

				if (enabled === false)
					continue;

				const cardElem = (
					<button class={"btn " + getCardButtonClass(card, index)}
							onClick={() => this.showCard(card)}
							disabled={enabled !== true}
							title={enabled !== true ? enabled : label}>
						{label}
					</button>
				)

				if (enabled !== true || cardButtons.length > 2){
					overflowCardButtons.push(cardElem);
				} else {
					cardButtons.push(cardElem);
				}
			} catch (e){
				console.error("Failed to check if card is available", e);
			}
		}

		this.cardButtons = cardButtons;
		this.overflowCardButtons = overflowCardButtons;
		this.description = this.tokenDetails ? await getHardcodedDescription(this.tokenScript, this.tokenDetails) : this.collectionDetails.description ?? "";
	}

	// TODO: This is copied from tokens-grid-item, dedupe required
	private async showCard(card: Card){

		this.showLoader.emit();

		try {
			await this.tokenScript.showOrExecuteTokenCard(card, async (data: ITransactionStatus) => {

				if (data.status === "started")
					this.showLoader.emit();

				if (data.status === "confirmed")
					this.hideLoader.emit();

				await showTransactionNotification(data, this.showToast);
			});

		} catch(e){
			console.error(e);
			handleTransactionError(e, this.showToast);
		}

		this.hideLoader.emit();
	}

	render(){

		return (
			<Host>
				<div class={"token-viewer " + (this.fullWidth ? 'full-width' : '')} >
					{!this.isAttestation && this.collectionDetails && (
						<div>
							<div class="details-container">
								<div class="image-container">
									<token-icon style={{ minHeight: '100px;' }} src={
										this.tokenScript && this.tokenScript.getMetadata().imageUrl ?
											this.tokenScript.getMetadata().imageUrl :
											this.tokenDetails?.image ?? this.collectionDetails.image ?? (this.tokenScript ? this.tokenScript.getMetadata().iconUrl : null)
									} imageTitle={this.tokenDetails?.name ?? this.collectionDetails.name} />
								</div>
								<div class="info-container">
									<div class="main-info">
										<h1>{this.tokenDetails?.name ?? this.collectionDetails.name}</h1>
										<div class="owner-count">
											<span style={{ color: '#3D45FB' }}>
												{this.collectionDetails.tokenType === "erc20" ?
													'balance: ' + EthUtils.calculateDecimalValue(this.collectionDetails.balance, this.collectionDetails.decimals) :
													this.collectionDetails.tokenType !== 'erc721' ? 'balance: ' + (this.tokenDetails?.balance ?? this.collectionDetails.balance ?? 0) : '#' + this.tokenDetails.tokenId
												}
											</span>
										</div>
										<div class="collection-details">
											<token-icon
												style={{ width: '24px', borderRadius: '4px' }}
												src={this.collectionDetails.image}
												imageTitle={this.collectionDetails.name}
											/>
											<h4>{this.collectionDetails.name ?? this.tokenDetails?.name}</h4>
											<span>{this.collectionDetails.tokenType.toUpperCase()}</span>
										</div>
									</div>
									<div class="extra-info">
										<p innerHTML={ this.description && this.description.replace(/\n/g, '<br/>')}></p>
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
											<button class="btn more-actions-btn" onClick={() => this.overflowDialog.openDialog()}>
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
					{this.isAttestation && <iframe src="" class="iframe-viewer" id="frame" onLoad={() => this.iframeLoadListener(this.slnAttestation, this.decoded)} frameBorder={0} />}
				</div>
				<card-popover tokenScript={this.tokenScript}></card-popover>
			</Host>
		);
	}
}

import {Component, Element, Event, EventEmitter, h, Host, JSX, Prop, State} from "@stencil/core";
import {AppRoot, ShowToastEventArgs} from "../../app/app";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {getSingleTokenMetadata} from "../util/getSingleTokenMetadata";
import {ViewBinding} from "../tabbed/viewBinding";
import {getTokenUrlParams} from "../util/getTokenUrlParams";
import {getTokenScriptWithSingleTokenContext} from "../util/getTokenScriptWithSingleTokenContext";
import {getCardFromURL} from "../util/getCardFromURL";
import {connectEmulatorSocket} from "../util/connectEmulatorSocket";

@Component({
	tag: 'opensea-viewer',
	styleUrl: 'opensea-viewer.css',
	shadow: false,
	scoped: false
})
export class OpenseaViewer {

	@Element()
	host: HTMLElement;

	@Prop()
	app: AppRoot;

	@State()
	tokenDetails: ITokenDetail;

	@State()
	tokenScript: TokenScript;

	@State()
	showInfoCard = false;

	viewBinding: ViewBinding;

	urlRequest: URLSearchParams;

	@Event({
		eventName: 'showToast',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) showToast: EventEmitter<ShowToastEventArgs>;

	@Event({
		eventName: 'showLoader',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) showLoader: EventEmitter<void>;

	@Event({
		eventName: 'hideLoader',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) hideLoader: EventEmitter<void>;

	async componentWillLoad(){
		this.app.showTsLoader();
	}

	async componentDidLoad(){

		try {
			const query = new URLSearchParams(document.location.search.substring(1));
			const hashQuery = new URLSearchParams(document.location.hash.substring(1));

			for (const [key, param] of hashQuery.entries()){
				query.set(key, param);
			}

			this.urlRequest = query;

			await this.processUrlLoad();

		} catch (e){
			console.error(e);
			this.showToast.emit({
				type: 'error',
				title: "Failed to load token details",
				description: e.message
			});
		}

		this.app.hideTsLoader();
	}

	async processUrlLoad(){

		let {chain, contract, tokenId, tokenscriptUrl, emulator} = getTokenUrlParams();

		if (!tokenId)
			throw new Error('Token ID was not provided in the URL');

		const res = await getSingleTokenMetadata(chain, contract, tokenId, this.app.tsEngine);
		this.tokenDetails = res.detail;

		console.log("Token meta loaded!", this.tokenDetails);

		if (emulator){
			const emulatorUrl = new URL(decodeURIComponent(emulator)).origin;
			tokenscriptUrl = emulatorUrl + "/tokenscript.tsml";
			connectEmulatorSocket(emulatorUrl, async() => {
				await this.loadTokenScript(chain, contract, tokenId, tokenscriptUrl);
			});
		}

		await this.loadTokenScript(chain, contract, tokenId, tokenscriptUrl);
	}

	private async loadTokenScript(chain: number, contract: string, tokenId: string, tokenScriptUrl?: string){

		this.tokenScript = await getTokenScriptWithSingleTokenContext(this.app, chain, contract, this.tokenDetails.collectionDetails, this.tokenDetails, tokenId, tokenScriptUrl);
	}

	private displayInfoCard(){

		if (!this.viewBinding){
			this.viewBinding = new ViewBinding(this.host, this.showToast);
		}
		this.viewBinding.setTokenScript(this.tokenScript);
		this.tokenScript.setViewBinding(this.viewBinding);

		let card = getCardFromURL(this.tokenScript)?.card;
		// If card isn't explicitly set, we show the info card by default
		if (!card) {
			const publicCards = this.tokenScript.getCards().getPublicCards();
			if (publicCards.length){
				card = publicCards[0];
			} else {
				card = this.tokenScript.getCards()
					.filterCards(undefined, ["token"])?.[0];
			}
		}

		if (card) {
			this.tokenScript.showOrExecuteTokenCard(card);
			this.showInfoCard = true
		}
	}

	render(){

		return (
			<Host>
				<div class="opensea-viewer">
				{ this.tokenDetails ?
					[
						<div class="opensea-img-container" style={{backgroundImage: "url(" + (this.tokenDetails.image ?? (this.tokenScript ? this.tokenScript.getMetadata().imageUrl ?? this.tokenScript.getMetadata().iconUrl : '')) + ")"}} title={this.tokenDetails.name}>
							<div class="info-button-container">
								{ this.tokenScript ?
									<div class="info-button" title="Token Information" onClick={() => this.displayInfoCard()}>
										<img alt="Smart Layer" title="Token Information" src="/assets/icon/sl-icon-white.png" />
									</div> :
									<loading-spinner size="small" />
								}
							</div>
						</div>,
						<div class="card-overlay" style={{display: (this.showInfoCard ? "flex" : "none")}}>
							<div class="close-button" onClick={() => {
								this.showInfoCard = false;
								this.tokenScript.getViewController().unloadTokenCard();
							}}>x</div>
							<card-view></card-view>
						</div>
					]
				 : ''}
				</div>
				<div class="opensea-header">
					<a href="https://www.smartlayer.network/" target="_blank">
						<span>XNFT by</span>
						<img class="header-icon" alt="SmartLayer Network" src="assets/icon/smart-layer-icon.png"/>
					</a>
				</div>
			</Host>
		)
	}

}

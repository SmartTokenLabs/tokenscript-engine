import {Component, Element, Event, EventEmitter, h, Host, JSX, Prop, State} from "@stencil/core";
import {AppRoot, ShowToastEventArgs} from "../../app/app";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {ITokenDiscoveryAdapter} from "@tokenscript/engine-js/src/tokens/ITokenDiscoveryAdapter";
import {getSingleTokenMetadata} from "../util/getSingleTokenMetadata";
import {ViewBinding} from "../tabbed/viewBinding";

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
			this.loadTokenScript();

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

		const queryStr = document.location.search.substring(1);

		if (!queryStr)
			return false;

		const query = new URLSearchParams(queryStr);

		if (query.has("chain") && query.has("contract") && query.has("tokenId")){

			this.tokenDetails = await getSingleTokenMetadata(parseInt(query.get("chain")), query.get("contract"), query.get("tokenId"));

			console.log("Token meta loaded!", this.tokenDetails);

			return true;
		}

		throw new Error("Could not locate token details using the values provided in the URL");
	}

	private async loadTokenScript(){

		try {
			const chain: number = parseInt(this.urlRequest.get("chain"));
			const contract: string = this.urlRequest.get("contract");
			const tsId = chain + "-" + contract;
			const tokenScript = await this.app.loadTokenscript("resolve", tsId);

			const origins = tokenScript.getTokenOriginData();
			let selectedOrigin;

			for (const origin of origins){
				if (origin.chainId === chain && contract.toLowerCase() === contract.toLowerCase()){
					selectedOrigin = origin;
					origin.tokenDetails = [this.tokenDetails];
					break;
				}
			}

			if (selectedOrigin){
				tokenScript.setTokenMetadata(origins);

				class StaticDiscoveryAdapter implements ITokenDiscoveryAdapter {
					getTokens(initialTokenDetails: ITokenCollection[], refresh: boolean): Promise<ITokenCollection[]> {
						return Promise.resolve(origins);
					}
				}

				this.app.discoveryAdapter = new StaticDiscoveryAdapter();

				tokenScript.setCurrentTokenContext(selectedOrigin.originId, 0);
				this.tokenScript = tokenScript;
				this.viewBinding = new ViewBinding(this.host, this.showToast);
				this.viewBinding.setTokenScript(this.tokenScript);
				this.tokenScript.setViewBinding(this.viewBinding);


			}

		} catch (e){
			console.warn(e.message);
		}
	}

	private displayInfoCard(){
		const infoCard = this.tokenScript.getCards().find((card) => card.type === "token");

		if (infoCard) {
			this.tokenScript.showOrExecuteTokenCard(infoCard);
			this.showInfoCard = true
		}
	}

	render(){

		return (
			<Host>
				<div class="opensea-viewer">
				{ this.tokenDetails ?
					[
						<div class="opensea-img-container" style={{backgroundImage: "url(" + this.tokenDetails.image + ")"}} title={this.tokenDetails.name}>
							<div class="info-button-container">
								{ this.tokenScript ?
									<div class="info-button" title="Token Information" onClick={() => this.displayInfoCard()}>?</div> :
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
					<span>Powered by</span>
					<img class="header-icon" alt="TokenScript icon" src="assets/icon/tokenscript-logo.svg"/>
				</div>
			</Host>
		)
	}

}

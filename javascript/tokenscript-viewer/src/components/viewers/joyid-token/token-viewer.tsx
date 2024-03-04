import {Component, Event, EventEmitter, h, Host, JSX, Prop, State} from "@stencil/core";
import {AppRoot, ShowToastEventArgs} from "../../app/app";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {ITokenDiscoveryAdapter} from "@tokenscript/engine-js/src/tokens/ITokenDiscoveryAdapter";
import {getSingleTokenMetadata} from "../util/getSingleTokenMetadata";
import {getHardcodedDescription} from "../util/getHardcodedDescription";

@Component({
	tag: 'token-viewer',
	styleUrl: 'token-viewer.css',
	shadow: false,
	scoped: false
})
export class TokenViewer {

	@Prop()
	app: AppRoot;

	@State()
	tokenDetails: ITokenDetail;

	@State()
	tokenScript: TokenScript;

	@State()
	description: string = "";

	urlRequest: URLSearchParams;

	@State() cardButtons: JSX.Element[]|undefined;

	@State() actionsEnabled = true;

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
	}

	async processUrlLoad(){

		const queryStr = document.location.search.substring(1);

		if (!queryStr)
			return false;

		const query = new URLSearchParams(queryStr);

		if (query.has("chain") && query.has("contract") && query.has("tokenId")){

			if (query.get("actionsEnabled") === "false")
				this.actionsEnabled = false;

			this.app.showTsLoader();

			this.tokenDetails = await getSingleTokenMetadata(parseInt(query.get("chain")), query.get("contract"), query.get("tokenId"));

			console.log("Token meta loaded!", this.tokenDetails);

			this.app.hideTsLoader();

			this.loadTokenScript();

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
				this.description = await getHardcodedDescription(this.tokenScript, this.tokenDetails);
			}

		} catch (e){
			console.warn(e.message);
			this.showToast.emit({
				type: 'error',
				title: "Failed to load TokenScript",
				description: e.message
			});
			this.description = this.tokenDetails.description;
		}
	}

	render(){

		return (
			<Host>
				<div class="token-viewer">
					{ this.tokenDetails ? (
					<div>
						<div class="details-container">
							<div class="image-container">
								<token-icon style={{minHeight: "100px;"}} src={this.tokenDetails.image} imageTitle={this.tokenDetails.name} />
							</div>
							<div class="info-container">
								<div class="main-info">
									<div class="title-row">
										<div class="title-container">
											<h1>{this.tokenDetails.name}</h1>
											<div class="owner-count">
												<span style={{color: "#3D45FB"}}>
													{
														this.tokenDetails.collectionDetails.tokenType === "erc1155" ?
															("balance: " + this.tokenDetails.balance) :
															("#" + this.tokenDetails.tokenId)
													}
												</span>
											</div>
										</div>
										<div class="security-wrapper">
											{this.tokenScript ? <security-status tokenScript={this.tokenScript} size="small" /> : ''}
										</div>
									</div>
									<div class="collection-details">
										<token-icon style={{width: "24px", borderRadius: "4px"}} src={this.tokenDetails.collectionDetails.image} imageTitle={this.tokenDetails.collectionDetails.name}/>
										<h4>{this.tokenDetails.collectionDetails.name ?? this.tokenDetails.name}</h4>
										<span>{this.tokenDetails.collectionDetails.tokenType.toUpperCase()}</span>
									</div>
								</div>
								<div class="extra-info">
									<p innerHTML={this.description.replace(/\n/g, "<br/>")}></p>
									<div class="attribute-container">
										{this.tokenDetails.attributes?.length ? this.tokenDetails.attributes.map((attr) => {
											return (
												<div class="attribute-item" title={attr.trait_type + ": " + attr.value}>
													<h5>{attr.trait_type}</h5>
													<span>{attr.value}</span>
												</div>
											)
										}) : ''}
									</div>
								</div>
							</div>
						</div>
						<action-bar engine={this.app.tsEngine}
									tokenDetails={this.tokenDetails}
									tokenScript={this.tokenScript}
									actionsEnabled={this.actionsEnabled} />
					</div>
					) : '' }
				</div>
				<card-popover tokenScript={this.tokenScript}></card-popover>
			</Host>
		)
	}

}

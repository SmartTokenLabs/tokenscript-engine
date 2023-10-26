import {Component, Event, EventEmitter, h, Host, JSX, Prop, State} from "@stencil/core";
import {AppRoot, ShowToastEventArgs} from "../../app/app";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {CHAIN_MAP} from "../../../integration/constants";
import {BlockChain, ITokenCollection, TokenType} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {BASE_TOKEN_DISCOVERY_URL} from "../../../integration/discoveryAdapter";
import {ITokenDiscoveryAdapter} from "@tokenscript/engine-js/src/tokens/ITokenDiscoveryAdapter";

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
	loadingTs = true;

	@State()
	tokenScript: TokenScript;

	urlRequest: URLSearchParams;

	@State() cardButtons: JSX.Element[]|undefined;

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

		try {
			const query = new URLSearchParams(document.location.search.substring(1));
			const hashQuery = new URLSearchParams(document.location.hash.substring(1));

			for (const [key, param] of hashQuery.entries()){
				query.set(key, param);
			}

			this.urlRequest = query;

			try {
				await this.processUrlLoad();
			} catch (e){

			}
		} catch (e){
			console.error(e)
		}
	}

	async componentDidLoad(){
		try {
			await this.loadTokenScript();
		} catch (e){
			console.error(e);
		}
	}

	async processUrlLoad(){

		const queryStr = document.location.search.substring(1);

		if (!queryStr)
			return false;

		const query = new URLSearchParams(queryStr);

		if (query.has("chain") && query.has("contract") && query.has("tokenId")){

			this.app.showTsLoader();

			const tokenMeta = await this.fetchTokenMetadata(parseInt(query.get("chain")), query.get("contract"), query.get("tokenId"));

			console.log("Token meta loaded!", tokenMeta);

			this.tokenDetails = {
				attributes: tokenMeta.attributes,
				collectionDetails: {
					originId: "",
					blockChain: "eth",
					chainId: parseInt(query.get("chain")),
					tokenType: tokenMeta.collectionData.contractType.toLowerCase() as TokenType,
					contractAddress: query.get("contract"),
					name: tokenMeta.collectionData.title as string,
					description: tokenMeta.collectionData.description as string,
					image: tokenMeta.collectionData.image as string,
				},
				collectionId: tokenMeta.collection,
				description: tokenMeta.description,
				image: tokenMeta.image,
				name: tokenMeta.title,
				tokenId: tokenMeta.tokenId,
				balance: tokenMeta.balance
			}

			this.app.hideTsLoader();

			return true;
		}

		// TODO: Show error screen

		throw new Error("Could not locate token details using the values provided in the URL");
	}


	private async fetchTokenMetadata(chain: number, contract: string, tokenId: string){

		const collectionUrl = `/get-token-collection?chain=${CHAIN_MAP[chain]}&smartContract=${contract}&tokenId=${tokenId}`;
		const tokenUrl = `/get-token?chain=${CHAIN_MAP[chain]}&collectionAddress=${contract}&tokenId=${tokenId}`;

		const responses = await Promise.all([
			fetch(BASE_TOKEN_DISCOVERY_URL + collectionUrl),
			await fetch(BASE_TOKEN_DISCOVERY_URL + tokenUrl)
		]);

		const ok = (
			(responses[0].status >= 200 && responses[0].status <= 299) &&
			(responses[1].status >= 200 && responses[0].status <= 299)
		)
		if (!ok) {
			throw new Error("Failed to load token details");
		}

		return {
			collectionData: await responses[0].json(),
			...await responses[1].json()
		}
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
			}

			console.log("tokenscript loaded!!");

		} catch (e){
			console.warn(e.message);
		}

		this.loadingTs = false;
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
									<div class="collection-details">
										<token-icon style={{width: "24px", borderRadius: "4px"}} src={this.tokenDetails.collectionDetails.image} imageTitle={this.tokenDetails.collectionDetails.name}/>
										<h4>{this.tokenDetails.collectionDetails.name ?? this.tokenDetails.name}</h4>
										<span>{this.tokenDetails.collectionDetails.tokenType.toUpperCase()}</span>
									</div>
								</div>
								<div class="extra-info">
									<p>{this.tokenDetails.description}</p>
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
									loading={this.loadingTs} />
					</div>
					) : <loading-spinner color={"#595959"} size={"small"} style={{textAlign: "center"}} /> }
				</div>
				<card-popover tokenScript={this.tokenScript}></card-popover>
			</Host>
		)
	}

}

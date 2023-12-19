import {Component, Event, EventEmitter, h, Host, JSX, Prop, State} from "@stencil/core";
import {AppRoot, ShowToastEventArgs} from "../../app/app";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {ITokenDiscoveryAdapter} from "@tokenscript/engine-js/src/tokens/ITokenDiscoveryAdapter";
import {getSingleTokenMetadata} from "../util/getSingleTokenMetadata";

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

		if (query.get("sln") === "true" && query.has("issuer") && query.has("uid")){
			this.app.showTsLoader();

			//TODO: load attestation from SLN-A
			const attestation =
				"eNrFU0uOWzEMu0vWQaG_rGUzmV6i6MKWrAMULdDj18kV3mIEwwvDpCSC_HmDb2S3OyKqnut-g38fZB79eLKXCo_xsSX4Bz4frkzwJLaNA3XfXp9NtvkMyzF8e8ps0C4sbZqxKpVwjK00snBMkBG1Vu2QSBTTepPgqExWYCWyFtdCYHIFclvaEXtgdPOEUc1wYORCTi172-YzCfmLZ7vh57I9KJ6fErXnA2AggTMnfrJ-z3Z_Pt5NQ3pOI4yzVQzF1dFDlHRO75ilZq62rSrnZJGNonMvEqQcKf0m8bZeEGuvs6YVLCLe0agkFIYYo4oNgHBRRrvOHB4J7cNy9nv9o74DhR-Q3-H98Of33_2ih0s1rsEhL-KBLqHxanvAl_RfWMrIxMxyvP0FJXhOZmCOEwldy2mdgXrJ5lUA3GC9JV-G112MuDnp5GUe10fa4NCTsTYq0xPZsmN_rNCxpSQbzQ9R1tF5UbHPuTRhNIWsxK0y86KFbnf49R_KlwhT";

			console.log("Attestation loaded!");

			this.app.hideTsLoader();

			const params = new URLSearchParams();
			params.set("attestation", attestation);
			params.set("type", "eas");

			this.loadAttestationAndTokenScript(params);

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
			}

		} catch (e){
			console.warn(e.message);
		}
	}

  private async loadAttestationAndTokenScript(params: URLSearchParams) {
    const { definition, tokenScript } = await this.app.tsEngine.importAttestationUsingTokenScript(params);

    this.showToast.emit({
      type: 'success',
      title: 'Attestation imported',
      description: 'Successfully imported ' + definition.meta.name,
    });

    this.tokenScript = tokenScript;
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
									actionsEnabled={this.actionsEnabled} />
					</div>
					) : '' }
				</div>
				<card-popover tokenScript={this.tokenScript}></card-popover>
			</Host>
		)
	}

}

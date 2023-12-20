import {Component, Event, EventEmitter, h, Host, JSX, Prop, State} from "@stencil/core";
import {AppRoot, ShowToastEventArgs} from "../../app/app";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {ITokenDiscoveryAdapter} from "@tokenscript/engine-js/src/tokens/ITokenDiscoveryAdapter";
import {SLNAdapter} from "../../../integration/slnAdapter";
import {getSingleTokenMetadata} from "../util/getSingleTokenMetadata";
import {zipAndEncodeToBase64} from "@tokenscript/engine-js/src/attestation/AttestationUrl";

const SLN_CHAIN_IDS = [82459, 5169]
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

	private viewerPopover: HTMLViewerPopoverElement;

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
			const chain = parseInt(query.get("chain"))
			const contract = query.get("contract")
			const tokenId = query.get("tokenId")

			if (SLN_CHAIN_IDS.includes(chain)) {
				this.app.showTsLoader();

				const slnAdapter = new SLNAdapter(chain)
				const slnAttestation = await slnAdapter.getAttestation(contract, tokenId)
				const attestation = zipAndEncodeToBase64({ sig: slnAttestation.rawData, signer: slnAttestation.attester})
				// Test attestation
				// const attestation =
				// 	"eNrFVEmuVDEMvMtbt5CneFjSvz-XQCzsDAdAIHF83H2FlsCKsnBc5dhJ-fsFX0ivGyKO0dvtgj8fpBbn_mBbQ9j9Y0vwN3zcbTDBg1g3Oo59PYORMMIGGloYnfKFbqm6DSahh8bR2mvr8FVDPGfxjOnpQnVkvEhgnWnZCJcaKiY1VWZhsu3K5BWyIyqGZd9oJYDjTp-oMzQrrxvZk2eb4mfpdorHp8TaeX-GEhjzxE8eX-cxe9xfSdcIlhLhBF0rU1IO6TprbyKWITa16yzKsWaXQHoGjy41SNiIXiR29BRE7UJ3XVAN3XFwkFAoYvharADUPDOOjZxuMeGY68yzniTdfQMKUwe5wcvx6-fv_WrMW-bvwWG-iQd6C43vpgdT0WGqrEf38xn-sQ1GJmYWHvAfTLDXqf7BniWnci3BUqs6NVf7W5uco5WftPrfbmxtVwT6ma7RHVNBmsIlFl7uszz2WbaKds-CFnSPgVZDn83O0hKaNg7a2YBHZBfwexVcN_jxF-QuCZ4=";

				console.log("Attestation loaded!");

				this.app.hideTsLoader();

				const params = new URLSearchParams();
				params.set("attestation", attestation);
				params.set("type", "eas");
				// TODO: only for testing, remove later this as SLN attestation will embed scriptURI
				params.set("scriptURI", "http://localhost:3333/assets/tokenscripts/attestation.tsml");

				this.loadAttestationAndTokenScript(params);
			} else {
				if (query.get("actionsEnabled") === "false")
					this.actionsEnabled = false;

				this.app.showTsLoader();

				this.tokenDetails = await getSingleTokenMetadata(chain, contract, tokenId);

				console.log("Token meta loaded!", this.tokenDetails);

				this.app.hideTsLoader();

				this.loadTokenScript();
			}

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
    const { tokenScript } = await this.app.tsEngine.importAttestationUsingTokenScript(params);
    this.tokenScript = tokenScript;

		this.viewerPopover.open(this.tokenScript)
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
				<viewer-popover ref={el => this.viewerPopover = el as HTMLViewerPopoverElement}></viewer-popover>
			</Host>
		)
	}

}

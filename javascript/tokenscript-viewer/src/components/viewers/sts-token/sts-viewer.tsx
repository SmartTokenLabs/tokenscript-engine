import {Component, Event, EventEmitter, h, Host, JSX, Prop, State} from "@stencil/core";
import {AppRoot, ShowToastEventArgs} from "../../app/app";
import {ITransactionStatus, TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {ITokenDiscoveryAdapter} from "@tokenscript/engine-js/src/tokens/ITokenDiscoveryAdapter";
import {getSingleTokenMetadata} from "../util/getSingleTokenMetadata";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {handleTransactionError, showTransactionNotification} from "../util/showTransactionNotification";

@Component({
	tag: 'sts-viewer',
	styleUrl: 'sts-viewer.css',
	shadow: false,
	scoped: false
})
export class SmartTokenStoreViewer {

	@Prop()
	app: AppRoot;

	@State()
	tokenDetails: ITokenDetail;

	@State()
	tokenScript: TokenScript;

	urlRequest: URLSearchParams;

	@State() cardButtons: JSX.Element[]|undefined;

	@State() overflowCardButtons: JSX.Element[];

	private overflowDialog: HTMLActionOverflowModalElement;

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
			let tokenScript;

			if (this.urlRequest.has("tokenscriptUrl")) {
				tokenScript = await this.app.loadTokenscript("url", this.urlRequest.get("tokenscriptUrl"));
			} else {
				const tsId = chain + "-" + contract;
				tokenScript = await this.app.loadTokenscript("resolve", tsId);
			}

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

				this.loadCards();
			}

		} catch (e){
			console.warn(e.message);
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
					<button class={"btn " + (index === 0 ? "btn-primary" : "btn-secondary")}
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
	}

	// TODO: This is copied from tokens-grid-item, dedupe required
	private async showCard(card: Card){

		window.scrollTo(0, 0);

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
			this.hideLoader.emit();
			handleTransactionError(e, this.showToast);
			return;
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
						<div class="actions">
							{this.cardButtons ?
								this.cardButtons :
								<loading-spinner color={"#595959"} size={"small"} style={{textAlign: "center"}}/>
							}
							{this.overflowCardButtons?.length ?
								[
									(<button class="btn more-actions-btn"
											 onClick={() => this.overflowDialog.openDialog()}>
										+ More actions
									</button>),
									(<action-overflow-modal
										ref={(el) => this.overflowDialog = el as HTMLActionOverflowModalElement}>
										<div class="actions">
											{this.overflowCardButtons}
										</div>
									</action-overflow-modal>)
								] : ''
							}
						</div>
					</div>
					) : '' }
				</div>
				<card-popover tokenScript={this.tokenScript}></card-popover>
			</Host>
		)
	}

}

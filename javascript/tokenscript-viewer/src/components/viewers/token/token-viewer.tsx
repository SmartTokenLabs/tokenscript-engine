import {Component, h, JSX, Prop, State} from "@stencil/core";
import {AppRoot} from "../../app/app";
import {ITokenIdContext, ITransactionStatus, TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {CHAIN_MAP} from "../../../integration/constants";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";

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

			/*const tsId = query.get("chain") + "-" + query.get("contract");

			this.openTokenScript("resolve", tsId);*/

			this.app.showTsLoader();

			const tokenMeta = await this.fetchTokenMetadata(parseInt(query.get("chain")), query.get("contract"), query.get("tokenId"));

			console.log("Token meta loaded!", tokenMeta);

			this.tokenDetails = {
				attributes: tokenMeta.attributes,
				collectionDetails: undefined,
				collectionId: tokenMeta.collection,
				description: tokenMeta.description,
				image: tokenMeta.image,
				name: tokenMeta.title,
				tokenId: tokenMeta.tokenId
			}

			this.app.hideTsLoader();

			return true;
		}

		// TODO: Show error screen

		throw new Error("Could not locate token details using the values provided in the URL");
	}


	private async fetchTokenMetadata(chain: number, contract: string, tokenId: string){

		const request = `/get-token?chain=${CHAIN_MAP[chain]}&collectionAddress=${contract}&tokenId=${tokenId}`;
		const response = await fetch("http://localhost:3000" + request);
		const ok = response.status >= 200 && response.status <= 299
		if (!ok) {
			throw new Error("Failed to load token details");
		}

		return response.json();
	}

	private async loadTokenScript(){

		//this.app.showTsLoader();

		try {
			const chain: number = parseInt(this.urlRequest.get("chain"));
			const contract: string = this.urlRequest.get("contract");
			const tsId = chain + "-" + contract;
			const tokenScript = await this.app.loadTokenscript("resolve", tsId);

			/*this.card = findCardByUrlParam(this.urlRequest.get("card"), this.tokenScript).card;

			if (!this.card)
				throw new Error("Card " + this.urlRequest.get("card") + " could not be found.");*/

			// Find token metadata corresponding to current contract

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
				tokenScript.setCurrentTokenContext(selectedOrigin.originId, 0);
				this.tokenScript = tokenScript;
				await this.loadCardButtons(selectedOrigin)
			}

			console.log("tokenscript loaded!!");

		} catch (e){
			console.error(e);
			//alert("Failed to load TokenScript: " + e.message);
		}

		//this.app.hideTsLoader();
	}

	private async loadCardButtons(token: ITokenCollection){

		const cardButtons: JSX.Element[] = [];

		// TODO: Rework NFT/fungible interfaces so they are cross compatible
		const context: ITokenIdContext = {
			originId: token.originId,
			chainId: token.chainId,
			selectedTokenId: this.tokenDetails.tokenId
		}

		const cards = this.tokenScript.getCards(token.originId);

		for (let [index, card] of cards.entries()){

			let label = card.label;

			if (label === "Unnamed Card")
				label = card.type === "token" ? "Token Info" : card.type + " Card";

			try {
				const enabled = await card.isEnabledOrReason(context);

				if (enabled === false)
					continue;

				cardButtons.push((
					<button class={"btn " + (index === 0 ? "btn-primary" : "btn-secondary")}
							onClick={() => this.showCard(card, index)}
							disabled={enabled !== true}
							title={enabled !== true ? enabled : label}>
						{label}
					</button>
				));
			} catch (e){
				console.error("Failed to check if card is available", e);
			}
		}

		this.cardButtons = cardButtons;
	}

	// TODO: This is copied from tokens-grid, dedupe required
	private async showCard(card: Card, cardIndex: number){

		window.scrollTo(0, 0);

		try {
			await this.tokenScript.showOrExecuteTokenCard(card, async (data: ITransactionStatus) => {

				/*if (data.status === "started")
					this.showLoader.emit();

				if (data.status === "confirmed")
					this.hideLoader.emit();

				await showTransactionNotification(data, this.showToast);*/
			});

		} catch(e){
			console.error(e);
			/*this.hideLoader.emit();
			this.showToast.emit({
				type: 'error',
				title: "Transaction Error",
				description: e.message
			});*/
			return;
		}

		// TODO: Remove index - all cards should have a unique name but some current tokenscripts don't match the schema
		// TODO: set only card param rather than updating the whole hash query
		if (card.view)
			document.location.hash = "#card=" + (card.name ?? cardIndex);
	}

	render(){

		//if (this.tokenDetails){
			return (
				<div class="token-viewer">
					{ this.tokenDetails ? (<div><div class="image-container">
						<token-icon style={{minHeight: "100px;"}} src={this.tokenDetails.image} imageTitle={this.tokenDetails.name} />
					</div>
					<div class="info-container">
						<h1>{this.tokenDetails.name}</h1>
						<p>{this.tokenDetails.description}</p>
						<div class="attribute-container">
							{this.tokenDetails.attributes?.length ? this.tokenDetails.attributes.map((attr) => {
								return (
									<div class="attribute-item">
										{attr.trait_type}<br/>
										{attr.value}
									</div>
								)
							}) : ''}
						</div>
					</div></div>) : ''}
					<div class="actions" style={{textAlign: "center"}}>
						{this.cardButtons !== undefined ?
							this.cardButtons :
							<loading-spinner color={"#595959"} size={"small"} style={{textAlign: "center"}}/>
						}
					</div>
					<card-modal tokenScript={this.tokenScript}></card-modal>
				</div>
			)
		//}

		//return ('');
	}

}

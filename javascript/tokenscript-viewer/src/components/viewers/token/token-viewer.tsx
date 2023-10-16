import {Component, h, Prop, State} from "@stencil/core";
import {AppRoot, TokenScriptSource} from "../../app/app";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {findCardByUrlParam} from "../util/findCardByUrlParam";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {CHAIN_MAP} from "../../../integration/constants";

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

	card: Card

	componentWillLoad(){

		try {
			const query = new URLSearchParams(document.location.search.substring(1));
			const hashQuery = new URLSearchParams(document.location.hash.substring(1));

			for (const [key, param] of hashQuery.entries()){
				query.set(key, param);
			}

			this.urlRequest = query;

			this.processUrlLoad();
		} catch (e){
			console.error(e)
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

	private async openTokenScript(source: TokenScriptSource, tsId?: string){

		this.app.showTsLoader();

		try {
			this.tokenScript = await this.app.loadTokenscript(source, tsId)

			this.card = findCardByUrlParam(this.urlRequest.get("card"), this.tokenScript).card;

			if (!this.card)
				throw new Error("Card " + this.urlRequest.get("card") + " could not be found.");

		} catch (e){
			console.error(e);
			alert("Failed to load TokenScript: " + e.message);
		}

		this.app.hideTsLoader();
	}

	render(){

		if (this.tokenDetails){
			return (
				<div class="token-viewer">
					<div class="image-container">
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
					</div>
				</div>
			)
		}

		return ('');
	}

}

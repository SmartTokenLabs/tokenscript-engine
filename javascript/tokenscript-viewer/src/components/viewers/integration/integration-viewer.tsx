import {Component, h, Prop, State} from "@stencil/core";
import {AppRoot, TokenScriptSource} from "../../app/app";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {findCardByUrlParam} from "../util/findCardByUrlParam";

@Component({
	tag: 'integration-viewer',
	// styleUrl: 'tabbed-viewer.css',
	shadow: false,
	scoped: false
})
export class IntegrationViewer {

	@Prop()
	app: AppRoot;

	@State()
	tokenScript: TokenScript;

	@State()
	step: 'confirm' | 'token' | 'view';

	urlRequest: URLSearchParams;

	messageTarget?: Window;

	card: Card

	componentWillLoad(){

		try {
			const query = new URLSearchParams(document.location.search.substring(1));
			const hashQuery = new URLSearchParams(document.location.hash.substring(1));

			for (const [key, param] of hashQuery.entries()){
				query.set(key, param);
			}

			this.urlRequest = query;

			this.verifyRequest();

			this.processUrlLoad();
		} catch (e){
			console.error(e)
		}
	}

	private verifyRequest(){

		if (!this.urlRequest.has("callbackUri")){

			this.messageTarget = window.parent ? window.parent : window.opener;

			console.log(this.messageTarget);

			if (!this.messageTarget || this.messageTarget.location.href === document.location.href)
				throw new Error("Cannot return message to requester, no callbackUrl supplied or window parent & opener is null.");

		}
	}

	async processUrlLoad(){

		const queryStr = document.location.search.substring(1);

		if (!queryStr)
			return false;

		const query = new URLSearchParams(queryStr);

		if (query.has("tokenscriptUrl")){

			this.openTokenScript("url", query.get("tokenscriptUrl"));

			return true;
		} else if (query.has("chain") && query.has("contract")){

			const tsId = query.get("chain") + "-" + query.get("contract");

			this.openTokenScript("resolve", tsId);

			return true;
		}

		throw new Error("Could not locate TokenScript using the values provided in the URL");
	}

	private async openTokenScript(source: TokenScriptSource, tsId?: string){

		this.app.showTsLoader();

		try {
			this.tokenScript = await this.app.loadTokenscript(source, tsId)

			this.card = findCardByUrlParam(this.urlRequest.get("card"), this.tokenScript).card;

			if (!this.card)
				throw new Error("Card " + this.urlRequest.get("card") + " could not be found.");

			this.step = "confirm";

		} catch (e){
			console.error(e);
			alert("Failed to load TokenScript: " + e.message);
		}

		this.app.hideTsLoader();
	}

	returnResultToRequester(data: any){

		if (this.messageTarget){
			this.messageTarget.postMessage(data, '*');
		} else {
			const uri = new URL(this.urlRequest.get("callbackUri"));
			const hQuery = new URLSearchParams(uri.hash.substring(1));

			for (const [key, value] of Object.entries(data)){
				hQuery.set(key, typeof value === "object" ? JSON.stringify(value) : value.toString());
			}

			uri.hash = hQuery.toString();

			document.location.href = uri.href;
		}
	}

	render(){

		if (this.tokenScript){
			switch (this.step){
				case "confirm":
					return (<confirm-step viewer={this} tokenScript={this.tokenScript}></confirm-step>);

				case "token":
					return (<select-step viewer={this} tokenScript={this.tokenScript} card={this.card}></select-step>);

				case "view":
					return (<view-step viewer={this} tokenScript={this.tokenScript} card={this.card}></view-step>);
			}
		}

		return ('');
	}

}

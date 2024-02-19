import {TokenScript} from "../TokenScript";
import {Card} from "../tokenScript/Card";
import CARD_SDK_V1 from "./sdk/v1.txt";
import {LocalStorageProxy} from "./data/LocalStorageProxy";

/**
 * TokenView data contains helper functions for
 */
export class TokenViewData {

	// This is a hacky fix to call tokenUpdated event with the same div target that was first rendered.
	private viewContainerId;
	private localStorageProxy: LocalStorageProxy;

	constructor(private tokenScript: TokenScript, private card: Card) {
		this.localStorageProxy = new LocalStorageProxy(this.tokenScript);
	}

	/**
	 * Returns the full view content to be loaded into the webview or iframe.
	 * This function prepends in-built engine scripts, as well as parsing and processing
	 * the view content to inject common viewContent data and ensure correct formatting.
	 */
	public async renderViewHtml(){

		let body = "";

		body += '<div id="' + this.getViewDataId() + '" class="token-card"></div>' +
			'<script type="text/javascript">' + await this.getTokenJavascript() + '</script>';

		const viewChildren = this.card.view.children;

		for (let x=0; x<viewChildren.length; x++){

			const part = viewChildren[x];

			if (part.nodeName == "#text")
				continue;

			if (part.nodeName === "ts:viewContent"){

				const name = part.getAttribute("name");

				const commonElems = this.tokenScript.getViewContent(name);

				if (!commonElems){
					console.error("Could not find viewContent element with " + name);
					continue;
				}

				for (let i=0; i<commonElems.length; i++) {
					body = this.processTags(commonElems[i], body);
				}

				continue;
			}

			body = this.processTags(part, body);
		}

		return `
			<!DOCTYPE html>
				<html lang="en">
				<head>
					<title>TokenScript</title>
					<meta http-equiv="content-type" content="text/html; charset=utf-8" />
				</head>
				<body>
					${body}
				</body>
			</html>
		`;
	}

	/**
	 * Process tags to ensure the correct HTML formatting for styles & scripts, reverting entity escaping where necessary.
	 * @param part
	 * @param body
	 * @private
	 */
	private processTags(part: Element, body: string){

		if (part.localName == "script"){

			let scriptContent;

			if (part.innerHTML.indexOf("<![CDATA[") === -1) {
				// If the view content is not within a CData tag, then we need to decode HTML entities.
				const textElem = document.createElement("textarea");
				textElem.innerHTML = part.innerHTML;
				scriptContent = textElem.value;
			} else {
				scriptContent = part.innerHTML;
			}

			body += '<script ' + (part.getAttribute("type") === "module" ? 'type="module" crossorigin=""' : 'text/javascript') + '>' + scriptContent + '</script>';

		} else if (part.localName === "style") {
			body += '<style>' + part.innerHTML + '</style>';
		} else {
			if (part.outerHTML)
				body += part.outerHTML;
		}

		return body;
	}

	public async getCurrentTokenData(bypassLocks = false){

		const attrsData = {};

		const attrs = this.tokenScript.getAttributes();

		for (let attr of attrs) {
			try {
				attrsData[attr.getName()] = await attr.getJsonSafeValue(bypassLocks);
			} catch (e){
				console.warn(e);
			}
		}

		const localAttrs = this.card.getAttributes();

		for (let localAttr of localAttrs) {
			try {
				attrsData[localAttr.getName()] = await localAttr.getJsonSafeValue(bypassLocks);
			} catch (e) {
				console.warn(e);
			}
		}

		const tokenContextData = await this.tokenScript.getTokenContextData();

		return {...attrsData, ...tokenContextData};
	}

	public getViewDataId(){
		if (!this.viewContainerId){
			this.viewContainerId = "token-card-" + this.tokenScript.getCurrentTokenContext()?.selectedTokenId;
		}

		return this.viewContainerId;
	}

	public async getTokenJavascript(){

		const tokenData = await this.getCurrentTokenData();

		console.log("Loading view with data:");
		console.log(tokenData);

		const walletAdapter = await this.tokenScript.getEngine().getWalletAdapter();

		return `

		const currentTokenInstance = JSON.parse(String.raw \`${JSON.stringify(tokenData).replace(/`/g, "")}\`);
		const localStorageData = JSON.parse(String.raw \`${JSON.stringify(await this.localStorageProxy.getLocalStorageDictionary()).replace(/`/g, "")}\`);
		const walletAddress = '${tokenData.ownerAddress}'
		const addressHex = "${tokenData.ownerAddress}";
		const rpcURL = "${walletAdapter.getRpcUrl(tokenData.chainId)}";
		const chainID = "${tokenData.chainId}";
		const engineOrigin = "${document.location.origin}";

		// Injected card SDK
		${CARD_SDK_V1}

		window.tokenscript.setInstanceData({currentTokenInstance, engineOrigin, localStorageData});

		// TODO: Move to SDK
		// Extra initialisation
		function refresh() {
		   web3.tokens.dataChanged('test', web3.tokens.data, '${this.getViewDataId()}') //TODO: Cache previous value of token to feed into first arg
		}

		//window.onload = refresh;

		web3.eth = {
		walletBalance: 0
		}
		web3.eth_1 = {
		walletBalance: 0
		}
		web3.eth_8217 = {
		walletBalance: 0
		}

		document.addEventListener("DOMContentLoaded", function() {
			refresh();
		});

		${this.tokenScript.getViewBinding()?.getViewBindingJavascript()}

		`;
	}
}

export const initTokenScript = '';

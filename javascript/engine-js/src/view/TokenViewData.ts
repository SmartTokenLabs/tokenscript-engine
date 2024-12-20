import {EthUtils} from "../ethereum/EthUtils";
import {ITokenScript} from "../ITokenScript";
import {Card} from "../tokenScript/Card";
import {LocalStorageProxy} from "./data/LocalStorageProxy";
import CARD_SDK_V1 from "./sdk/v1.txt";

/**
 * TokenView data contains helper functions for
 */
export class TokenViewData {

	// This is a hacky fix to call tokenUpdated event with the same div target that was first rendered.
	private viewContainerId;
	private localStorageProxy: LocalStorageProxy;

	constructor(private tokenScript: ITokenScript, private card: Card) {
		this.localStorageProxy = new LocalStorageProxy(this.tokenScript);
	}

	/**
	 * Returns the full view content to be loaded into the webview or iframe.
	 * This function prepends in-built engine scripts, as well as parsing and processing
	 * the view content to inject common viewContent data and ensure correct formatting.
	 */
	public async renderViewHtml(){

		let body = "";

		// vconsole is required to debug Javascript errors on mobiles where remote debugging is not available
		if (new URLSearchParams(document.location.search).has("___debug")){
			body += `
				<script src="https://unpkg.com/vconsole@latest/dist/vconsole.min.js"></script>
				<script>
				  // VConsole will be exported to \`window.VConsole\` by default.
				  var vConsole = new window.VConsole({
				  	defaultPlugins: ['system', 'network']
				  });
				</script>
			`;
		}

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
					<script>
						document.location.hash = '${"#" + this.getCardUrlParameters()}';
					</script>
				</head>
				<body>
					${body}
				</body>
			</html>
		`;
	}

	public getCardUrlParameters(){

		let urlParams: string;

		if (this.card.urlFragment){
			urlParams = this.card.urlFragment;
		} else {
			const browserHashParams = new URLSearchParams(document.location.hash.substring(1));
			browserHashParams.set("card", this.card.name);
			browserHashParams.set("tsViewerType", (new URLSearchParams(document.location.search)).get("viewType") ?? "default");

			const params = new URLSearchParams(document.location.search)
			params.forEach((value, key) => {
				if (key.indexOf("ext_")===0 && value.length){
					browserHashParams.set(key, value);
				}
			});

			urlParams = browserHashParams.toString();
		}

		return urlParams;
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

			body += '<script ' +
				part.getAttributeNames().map((name) => {
					return `${name}="${part.getAttribute(name)}"`;
				}).join(" ") +
				'>' + scriptContent + '</script>';

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
			this.viewContainerId = "token-card-" + (this.tokenScript.getCurrentTokenContext()?.selectedTokenId ?? "");
		}

		return this.viewContainerId;
	}

	public async getTokenJavascript(){

		const tokenData = await this.getCurrentTokenData();

		console.trace("Loading view with data:", tokenData);

		const walletAdapter = await this.tokenScript.getEngine().getWalletAdapter();
		const rpcURLs = tokenData.chainId ? walletAdapter.getRpcUrls(tokenData.chainId) : [];

		return `

		const currentTokenInstance = JSON.parse(String.raw \`${JSON.stringify(EthUtils.bigIntsToString(tokenData)).replace(/`/g, "")}\`);
		const localStorageData = JSON.parse(String.raw \`${JSON.stringify(await this.localStorageProxy.getLocalStorageDictionary()).replace(/`/g, "")}\`);
		const chainConfig = JSON.parse(String.raw \`${JSON.stringify(walletAdapter.chainConfig).replace(/`/g, "")}\`);
		const env = JSON.parse(String.raw \`${JSON.stringify(this.tokenScript.getMetadata().env).replace(/`/g, "")}\`);
		const contractData = JSON.parse(String.raw \`${JSON.stringify(this.tokenScript.getContracts().getContractViewData()).replace(/`/g, "")}\`);
		const walletAddress = '${await walletAdapter.getCurrentWalletAddress()}';
		const rpcURL = "${rpcURLs?.[0] ?? ''}";
		const chainID = "${tokenData.chainId}";
		const engineOrigin = "${this.tokenScript.getEngine().config.viewerOrigin}";

		// Injected card SDK
		${CARD_SDK_V1}

		window.tokenscript.setInstanceData({currentTokenInstance, engineOrigin, localStorageData, chainConfig, env, contractData});

		// TODO: Move to SDK
		// Extra initialisation
		function refresh() {
		   web3.tokens.dataChanged('test', web3.tokens.data, '${this.getViewDataId()}') //TODO: Cache previous value of token to feed into first arg
		}

		document.addEventListener("DOMContentLoaded", function() {
			refresh();
		});

		${this.tokenScript.getViewBinding()?.getViewBindingJavascript()}

		`;
	}
}


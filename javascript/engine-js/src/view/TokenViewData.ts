import {TokenScript} from "../TokenScript";
import {Card} from "../tokenScript/Card";
import {CARD_SDK_V1} from "./sdk/v1";

/**
 * TokenView data contains helper functions for
 */
export class TokenViewData {

	// This is a hacky fix to call tokenUpdated event with the same div target that was first rendered.
	private viewContainerId;

	constructor(private tokenScript: TokenScript, private card: Card) {

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

		const _currentTokenInstance = JSON.parse(String.raw \`${JSON.stringify(tokenData).replace(/`/g, "")}\`);

		const walletAddress = '${tokenData.ownerAddress}'
		const addressHex = "${tokenData.ownerAddress}";
		const rpcURL = "${walletAdapter.getRpcUrl(tokenData.chainId)}";
		const chainID = "${tokenData.chainId}";

		// Injected card SDK
		${CARD_SDK_V1}

		window.tokenscript.setInstanceData(_currentTokenInstance);

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

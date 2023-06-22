import {TokenScript} from "../TokenScript";
import {Card} from "../tokenScript/Card";

/**
 * TokenView data contains helper functions for
 */
export class TokenViewData {

	// This is a hacky fix to call tokenUpdated event with the same div target that was first rendered.
	private viewContainerId;

	constructor(private tokenScript: TokenScript, private card: Card) {

	}

	public async getCurrentTokenData(bypassLocks = false){

		const tokenContext = this.tokenScript.getCurrentTokenContext();

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
			} catch (e){
				console.warn(e);
			}
		}

		let data;

		if (tokenContext){

			const nftDetails = tokenContext.selectedNftIndex !== undefined ? tokenContext.tokenDetails[tokenContext.selectedNftIndex] : null;

			// TODO: Find out where to use token name/description or collection name/description
			data = {
				name: nftDetails?.name ?? tokenContext.name,
				description: nftDetails?.description ?? tokenContext.description,
				label: tokenContext.name,
				symbol: tokenContext.symbol,
				_count: tokenContext.balance,
				contractAddress: tokenContext.collectionId,
				chainId: tokenContext.chainId,
				tokenId: tokenContext.selectedNftId,
				ownerAddress: await this.getCurrentOwnerAddress(),
				image_preview_url: nftDetails?.image ?? tokenContext.image,
				...attrsData
			};
		} else {
			const contracts = this.tokenScript.getContracts(true);

			const primaryAddr = contracts[Object.keys(contracts)[0]].getFirstAddress();

			data = {
				name: this.tokenScript.getName(),
				label: this.tokenScript.getLabel(),
				contractAddress: primaryAddr?.address,
				chainId: primaryAddr?.chain,
				ownerAddress: await this.getCurrentOwnerAddress(),
				...attrsData
			};
		}

		return data;
	}

	public getViewDataId(){
		if (!this.viewContainerId){
			this.viewContainerId = "token-card-" + this.tokenScript.getCurrentTokenContext()?.selectedNftId;
		}

		return this.viewContainerId;
	}

	public async getCurrentOwnerAddress(){
		// TODO: ownerAddress should probably come from token details rather than the current wallet
		const walletProvider = await this.tokenScript.getEngine().getWalletAdapter();

		return await walletProvider.getCurrentWalletAddress();
	}

	public async getTokenJavascript(){

		const tokenData = await this.getCurrentTokenData();

		console.log("Loading view with data:");
		console.log(tokenData);

		return `

		const _currentTokenInstance = JSON.parse('${JSON.stringify(tokenData).replace("^\\'", "\\'")}');

		const walletAddress = '${tokenData.ownerAddress}'
		const addressHex = "${tokenData.ownerAddress}";
		const rpcURL = "https://public-node-api.klaytnapi.com/v1/cypress"; // TODO: provide RPC URL
		const chainID = "${tokenData.chainId}";

		window.web3CallBacks = {}

		function executeCallback (id, error, value) {
			console.debug('Execute callback: ' + id + ' ' + value)
			window.web3CallBacks[id](error, value)
			delete window.web3CallBacks[id]
		}

		web3 = {
			personal: {
				sign: function (msgParams, cb) {
					const { data } = msgParams
					const { id = 8888 } = msgParams
					window.web3CallBacks[id] = cb
					alpha.signPersonalMessage(id, data);
				}
			},
			tokens: {
				data: {
					currentInstance: {},
				},
				dataChanged: (prevTokens, newTokens, id) => {
					console.log('web3.tokens.data changed.')
				}
			},
			action: {
				setProps: function (msgParams) {
					alpha.setValues(JSON.stringify(msgParams));
				}
			}
		}

		web3.tokens.data.currentInstance = _currentTokenInstance

		function refresh() {
		   web3.tokens.dataChanged('test', web3.tokens.data, '${this.getViewDataId()}') //TODO: Cache previous value of token to feed into first arg
		}

		window.onload = refresh;

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

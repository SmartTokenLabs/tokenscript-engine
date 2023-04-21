import {ITokenDiscoveryAdapter} from "../../../engine-js/src/tokens/ITokenDiscoveryAdapter";
import {IToken} from "../../../engine-js/src/tokens/IToken";

import {WalletConnection, Web3WalletProvider} from "../components/wallet/Web3WalletProvider";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {CHAIN_MAP} from "./constants";
import {INFTTokenDetail} from "@tokenscript/engine-js/src/tokens/INFTTokenDetail";

const COLLECTION_CACHE_TTL = 86400;
const TOKEN_CACHE_TTL = 3600;
const BASE_TOKEN_DISCOVERY_URL = 'https://api.token-discovery.tokenscript.org'

export class DiscoveryAdapter implements ITokenDiscoveryAdapter {

	constructor(private tokenScript: TokenScript) {
		Web3WalletProvider.registerWalletChangeListener(this.handleWalletChange.bind(this));
	}

	handleWalletChange(walletConnection: WalletConnection|undefined){
		if (walletConnection){
			this.tokenScript.getTokenMetadata(true);
		} else {
			this.tokenScript.setTokenMetadata([]);
		}
	}

	async getTokens(initialTokenDetails: IToken[], refresh: boolean): Promise<IToken[]> {

		const walletAddress = await this.getCurrentWalletAddress();

		let cachedTokens = refresh ? null : await this.getCachedTokens(initialTokenDetails, walletAddress);

		if (!cachedTokens){
			cachedTokens = await this.fetchTokens(initialTokenDetails, walletAddress);
			await this.storeCachedTokens(initialTokenDetails, walletAddress)
		}

		return cachedTokens;
	}

	async getCurrentWalletAddress(){
		return (await Web3WalletProvider.getWallet(true)).address;
	}

	async getCachedTokens(initialTokenDetails: IToken[], ownerAddress: string): Promise<IToken[]|false> {


		return false;
	}

	async storeCachedTokens(tokens: IToken[], ownerAddress: string){


	}

	async fetchTokens(initialTokenDetails: IToken[], ownerAddress: string){

		const tokenResult: IToken[] = [];

		for (const token of initialTokenDetails){

			if (!CHAIN_MAP[token.chainId])
				continue;

			const chain = CHAIN_MAP[token.chainId];

			try {
				const collectionData = await this.fetchTokenMetadata(token, chain);
				const tokenData = await this.fetchOwnerTokens(token, chain, ownerAddress)


				if (token.tokenType !== "erc20") {

					const nftTokenDetails: INFTTokenDetail[] = [];

					for (let tokenMeta of tokenData) {

						nftTokenDetails.push({
							collectionDetails: token,
							tokenId: tokenMeta.tokenId,
							name: tokenMeta.title,
							description: tokenMeta.description,
							image: tokenMeta.image,
							data: tokenMeta
						});
					}

					token.nftDetails = nftTokenDetails;
					token.balance = nftTokenDetails.length;

				} else if (tokenData.length > 0) {
					token.name = tokenData[0].title;
					token.balance = tokenData[0].data?.balance;
					token.decimals = tokenData[0].data?.decimals;
				} else {
					continue;
				}

				console.log("collection data: ", collectionData);

				token.image = collectionData.image;
				token.symbol = tokenData[0]?.symbol ? tokenData[0]?.symbol : tokenData[0]?.data?.symbol;

				tokenResult.push(token);

			} catch (e){
				console.error(e);
			}
		}

		return tokenResult;
	}

	private async fetchTokenMetadata(token: IToken, chain: string){

		const url = token.tokenType === "erc20" ?
			`/get-fungible-token?collectionAddress=${token.collectionId}&chain=${chain}&blockchain=evm` :
			`/get-token-collection?smartContract=${token.collectionId}&chain=${chain}&blockchain=evm`;

		return this.fetchRequest(url);
	}

	private async fetchOwnerTokens(token: IToken, chain: string, ownerAddress: string){

		const url = token.tokenType === "erc20" ?
			`/get-owner-fungible-tokens?collectionAddress=${token.collectionId}&owner=${ownerAddress}&chain=${chain}&blockchain=evm` :
			`/get-owner-tokens?smartContract=${token.collectionId}&chain=${chain}&owner=${ownerAddress}&blockchain=evm`;

		return this.fetchRequest(url);
	}

	private async fetchRequest(query: string){

		try {
			const response = await fetch(BASE_TOKEN_DISCOVERY_URL + query)
			const ok = response.status >= 200 && response.status <= 299
			if (!ok) {
				console.warn('token api request failed: ', query)
				return null;
			}

			return response.json();
		} catch (msg: any) {
			return null;
		}
	}
}

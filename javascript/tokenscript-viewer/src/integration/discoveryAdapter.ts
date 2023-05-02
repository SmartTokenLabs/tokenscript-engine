import {ITokenDiscoveryAdapter} from "../../../engine-js/src/tokens/ITokenDiscoveryAdapter";
import {IToken} from "../../../engine-js/src/tokens/IToken";

import {Web3WalletProvider} from "../components/wallet/Web3WalletProvider";
import {CHAIN_MAP} from "./constants";
import {INFTTokenDetail} from "@tokenscript/engine-js/src/tokens/INFTTokenDetail";
import {dbProvider} from "../providers/databaseProvider";

const COLLECTION_CACHE_TTL = 86400;
const TOKEN_CACHE_TTL = 3600;
const BASE_TOKEN_DISCOVERY_URL = 'https://api.token-discovery.tokenscript.org'

export class DiscoveryAdapter implements ITokenDiscoveryAdapter {

	async getTokens(initialTokenDetails: IToken[], refresh: boolean): Promise<IToken[]> {

		const resultTokens: IToken[] = [];

		if (!Web3WalletProvider.isWalletConnected()){
			Web3WalletProvider.getWallet(true);
			return [];
		}

		const walletAddress = await this.getCurrentWalletAddress();

		for (const initToken of initialTokenDetails){

			try {
				let cachedToken = refresh ? false : await this.getCachedTokens(initToken, walletAddress);

				if (!cachedToken) {
					cachedToken = await this.fetchTokens(initToken, walletAddress);
					await this.storeCachedTokens(cachedToken, walletAddress)
				}

				resultTokens.push(cachedToken);

			} catch (e){
				console.error(e);
			}
		}

		return resultTokens;
	}

	async getCurrentWalletAddress(){
		return (await Web3WalletProvider.getWallet(true)).address;
	}

	async getCachedTokens(initialTokenDetails: IToken, ownerAddress: string): Promise<IToken|false> {

		const token = await dbProvider.tokens.where({
			chainId: initialTokenDetails.chainId,
			collectionId: initialTokenDetails.collectionId,
			ownerAddress
		}).first();

		if (token && Date.now() < token.dt + (TOKEN_CACHE_TTL * 1000))
			return token.data;

		return false;
	}

	async storeCachedTokens(token: IToken, ownerAddress: string){

		await dbProvider.tokens.put({
			chainId: token.chainId,
			collectionId: token.collectionId,
			ownerAddress,
			data: token,
			dt: Date.now()
		});
	}

	async fetchTokens(token: IToken, ownerAddress: string){

		if (!CHAIN_MAP[token.chainId])
			throw new Error("Chain ID " + token.chainId + " is not supported for token discovery");

		const chain = CHAIN_MAP[token.chainId];

		let collectionData = await this.getCollectionMeta(token, chain);

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
			return token;
		}

		token.image = collectionData.image;
		token.symbol = tokenData[0]?.symbol ? tokenData[0]?.symbol : tokenData[0]?.data?.symbol;

		return token;
	}

	public async getCollectionMeta(token: IToken, chain: string){

		let collectionData = await this.getCachedMeta(token);

		if (!collectionData){
			collectionData = await this.fetchTokenMetadata(token, chain);
			await this.storeCachedMeta(token, collectionData);
		}

		return collectionData;
	}

	private async getCachedMeta(token: IToken){

		const tokenMeta = await dbProvider.tokenMeta.where({
			chainId: token.chainId,
			collectionId: token.collectionId,
		}).first();

		if (tokenMeta && Date.now() < tokenMeta.dt + (COLLECTION_CACHE_TTL * 1000))
			return tokenMeta.data;

		return false;
	}

	private async storeCachedMeta(token: IToken, data: any){

		await dbProvider.tokenMeta.put({
			chainId: token.chainId,
			collectionId: token.collectionId,
			data,
			dt: Date.now()
		});
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

import {ITokenDiscoveryAdapter} from "../../../engine-js/src/tokens/ITokenDiscoveryAdapter";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";

import {Web3WalletProvider} from "../components/wallet/Web3WalletProvider";
import {CHAIN_CONFIG, CHAIN_MAP, ChainID, ERC721_ABI_JSON} from "./constants";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {dbProvider} from "../providers/databaseProvider";
import {Contract, ethers} from "ethers";

const COLLECTION_CACHE_TTL = 86400;
const TOKEN_CACHE_TTL = 3600;
export const BASE_TOKEN_DISCOVERY_URL = 'https://api.token-discovery.tokenscript.org'

export class DiscoveryAdapter implements ITokenDiscoveryAdapter {

	async getTokens(initialTokenDetails: ITokenCollection[], refresh: boolean): Promise<ITokenCollection[]> {

		const resultTokens: ITokenCollection[] = [];

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

	async getCachedTokens(initialTokenDetails: ITokenCollection, ownerAddress: string): Promise<ITokenCollection|false> {

		const token = await dbProvider.tokens.where({
			chainId: initialTokenDetails.chainId,
			collectionId: initialTokenDetails.contractAddress,
			ownerAddress
		}).first();

		if (token && Date.now() < token.dt + (TOKEN_CACHE_TTL * 1000))
			return token.data;

		return false;
	}

	async storeCachedTokens(token: ITokenCollection, ownerAddress: string){

		await dbProvider.tokens.put({
			chainId: token.chainId,
			collectionId: token.contractAddress,
			ownerAddress,
			data: token,
			dt: Date.now()
		});
	}

	async fetchTokens(token: ITokenCollection, ownerAddress: string){

		if (!CHAIN_MAP[token.chainId])
			throw new Error("Chain ID " + token.chainId + " is not supported for token discovery");

		const chain = CHAIN_MAP[token.chainId];

		let collectionData = await this.getCollectionMeta(token, chain);


		if (token.chainId === ChainID.HARDHAT_LOCALHOST){

			const nftTokenDetails: ITokenDetail[] = await this.fetchOwnerTokensRpc(token, ownerAddress);

			token.tokenDetails = nftTokenDetails;
			token.balance = nftTokenDetails.length;
			token.symbol = collectionData?.symbol;
			token.decimals = 0;

			return token;
		}

		const tokenData = await this.fetchOwnerTokens(token, chain, ownerAddress);

		if (token.tokenType !== "erc20") {

			const nftTokenDetails: ITokenDetail[] = [];

			for (let tokenMeta of tokenData) {

				nftTokenDetails.push({
					collectionDetails: token,
					tokenId: tokenMeta.tokenId,
					collectionId: token.contractAddress,
					name: tokenMeta.title,
					description: tokenMeta.description,
					attributes: tokenMeta.attributes ?? [],
					image: tokenMeta.image,
					data: tokenMeta
				});
			}

			token.tokenDetails = nftTokenDetails;
			token.balance = nftTokenDetails.length;
			token.symbol = collectionData?.symbol;
			token.decimals = 0;

		} else if (tokenData.length > 0) {
			token.name = tokenData[0].title;
			token.balance = tokenData[0].data?.balance;
			token.symbol = tokenData[0].symbol;
			token.decimals = tokenData[0].data?.decimals;
		} else {
			return token;
		}

		if (collectionData?.image)
			token.image = collectionData.image;

		token.symbol = tokenData[0]?.symbol ? tokenData[0]?.symbol : tokenData[0]?.data?.symbol;

		return token;
	}

	public async getCollectionMeta(token: ITokenCollection, chain: string){

		let collectionData = await this.getCachedMeta(token);

		if (!collectionData){
			if (token.chainId === ChainID.HARDHAT_LOCALHOST){
				collectionData = await this.fetchTokenMetadataRpc(token);
			} else {
				collectionData = await this.fetchTokenMetadata(token, chain);
			}

			await this.storeCachedMeta(token, collectionData);
		}

		return collectionData;
	}

	private async getCachedMeta(token: ITokenCollection){

		const tokenMeta = await dbProvider.tokenMeta.where({
			chainId: token.chainId,
			collectionId: token.contractAddress,
		}).first();

		if (tokenMeta && Date.now() < tokenMeta.dt + (COLLECTION_CACHE_TTL * 1000))
			return tokenMeta.data;

		return false;
	}

	private async storeCachedMeta(token: ITokenCollection, data: any){

		await dbProvider.tokenMeta.put({
			chainId: token.chainId,
			collectionId: token.contractAddress,
			data,
			dt: Date.now()
		});
	}

	private async fetchTokenMetadata(token: ITokenCollection, chain: string){

		const url = token.tokenType === "erc20" ?
			`/get-fungible-token?collectionAddress=${token.contractAddress}&chain=${chain}&blockchain=evm` :
			`/get-token-collection?smartContract=${token.contractAddress}&chain=${chain}&blockchain=evm`;

		return this.fetchRequest(url);
	}

	private async fetchOwnerTokens(token: ITokenCollection, chain: string, ownerAddress: string){

		const url = token.tokenType === "erc20" ?
			`/get-owner-fungible-tokens?collectionAddress=${token.contractAddress}&owner=${ownerAddress}&chain=${chain}&blockchain=evm` :
			`/get-owner-tokens?smartContract=${token.contractAddress}&chain=${chain}&owner=${ownerAddress}&blockchain=evm`;

		return this.fetchRequest(url);
	}

	private async fetchTokenMetadataRpc(token: ITokenCollection){

		const contract = this.getEthersContractInstance(token.contractAddress, token.chainId);


		let name, symbol, contractUri, description, image;

		try {
			name = await contract.name();
		} catch (e){
			console.log(e);
			name = "Unknown Contract";
		}
		//console.log("Contract name: ", name);

		try {
			symbol = await contract.symbol();
		} catch (e){
			console.log(e);
		}
		//console.log("Contract symbol: ", symbol);

		try {
			contractUri = await contract.contractURI();
		} catch (e){
			console.log(e);
		}
		//console.log("Contract URI: ", contractUri);

		if (contractUri){
			const contractMeta = await (await fetch(contractUri, {
				headers: {
					'Accept': 'text/plain'
				}
			})).json();
			if (contractMeta.name || contractMeta.title)
				name = contractMeta.name ?? contractMeta.title;
			if (contractMeta.description)
				description = contractMeta.description;
			if (contractMeta.image)
				image = contractMeta.image;
		}

		return <ITokenCollection>{
			name: name ?? "Test collection",
			symbol: symbol,
			description: description ?? "",
			image: image ?? "",
		}
	}

	private async fetchOwnerTokensRpc(token: ITokenCollection,  owner: string) {

		const contract = this.getEthersContractInstance(token.contractAddress, token.chainId);

		// TODO: ERC-20 & token metadata
		const tokenDetails: ITokenDetail[] = [];

		try {
			const balance = BigInt(await contract.balanceOf(owner));

			//console.log("Owner balance: ", balance);

			for (let i=0; i<balance; i++){
				const tokenId = BigInt(await contract.tokenOfOwnerByIndex(owner, i));

				let meta: any = {};

				try {
					const metaUri = await contract.tokenURI(tokenId);

					meta = await (await fetch(metaUri, {
						headers: {
							'Accept': 'text/plain'
						}
					})).json();
				} catch (e){
					console.warn("Failed to load token metadata:", e);
				}

				console.log(meta);

				tokenDetails.push({
					collectionId: token.originId,
					tokenId: tokenId.toString(),
					name: meta.name ?? "Test token #" + tokenId,
					description: meta.description ?? "",
					image: meta.image ?? "",
					collectionDetails: token
				});
				//console.log("Meta Uri: ", metaUri);
			}

		} catch (e){
			console.error(e);
		}

		return tokenDetails;
	}

	private getEthersContractInstance(address: string, chainId: number){
		const provider = new ethers.providers.JsonRpcProvider(CHAIN_CONFIG[chainId].rpc);

		return new Contract(address, ERC721_ABI_JSON, provider);
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

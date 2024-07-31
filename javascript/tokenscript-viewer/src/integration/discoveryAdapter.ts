import {ITokenDiscoveryAdapter} from "../../../engine-js/src/tokens/ITokenDiscoveryAdapter";
import {ITokenCollection, TokenType} from "@tokenscript/engine-js/src/tokens/ITokenCollection";

import {Web3WalletProvider} from "../components/wallet/Web3WalletProvider";
import {CHAIN_CONFIG, CHAIN_MAP, ChainID, ERC20_ABI_JSON, ERC721_ABI_JSON} from "./constants";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {dbProvider} from "../providers/databaseProvider";
import {Contract, ethers, Network} from "ethers";
import {showToastNotification} from "../components/viewers/util/showToast";

const COLLECTION_CACHE_TTL = 86400;
const TOKEN_CACHE_TTL = 3600;
export const BASE_TOKEN_DISCOVERY_URL = 'https://api.token-discovery.tokenscript.org';
										//'http://localhost:3000';

export class DiscoveryAdapter implements ITokenDiscoveryAdapter {

	constructor(private enableStorage = true) {

	}

	async getTokens(initialTokenDetails: ITokenCollection[], refresh: boolean): Promise<ITokenCollection[]> {

		const resultTokens: ITokenCollection[] = [];

		if (!Web3WalletProvider.isWalletConnected()){
			//Web3WalletProvider.getWallet(true);
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
				await showToastNotification("error", "Token Discovery Error", e.message);
			}
		}

		return resultTokens;
	}

	async getCurrentWalletAddress(){
		return (await Web3WalletProvider.getWallet(true)).address;
	}

	async getCachedTokens(initialTokenDetails: ITokenCollection, ownerAddress: string): Promise<ITokenCollection|false> {

		if (!this.enableStorage)
			return false;

		try {
			const token = await dbProvider.tokens2.where({
				chainId: initialTokenDetails.chainId,
				collectionId: initialTokenDetails.contractAddress.toLowerCase(),
				tokenType: initialTokenDetails.tokenType,
				ownerAddress: ownerAddress.toLowerCase()
			}).first();

			if (token && Date.now() < token.dt + (TOKEN_CACHE_TTL * 1000))
				return token.data;
		} catch (e) {
			console.warn(e);
		}

		return false;
	}

	async storeCachedTokens(token: ITokenCollection, ownerAddress: string){

		if (!this.enableStorage)
			return;

		try {
			await dbProvider.tokens2.put({
				chainId: token.chainId,
				collectionId: token.contractAddress.toLowerCase(),
				tokenType: token.tokenType,
				ownerAddress: ownerAddress.toLowerCase(),
				data: token,
				dt: Date.now()
			});
		} catch (e) {
			console.warn(e);
		}
	}

	async fetchTokens(token: ITokenCollection, ownerAddress: string){

		if (!CHAIN_MAP[token.chainId])
			throw new Error("Chain ID " + token.chainId + " is not supported for token discovery");

		const chain = CHAIN_MAP[token.chainId];

		let collectionData = await this.getCollectionMeta(token, chain);

		token = {
			...token,
			...collectionData,
			originId: token.originId // Must not be overridden in case two tokenscripts use the same contract
		}

		if (token.chainId === ChainID.HARDHAT_LOCALHOST){

			token = await this.fetchOwnerTokensRpc(token, ownerAddress);

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
					balance: tokenMeta.balance ?? tokenMeta.data?.balance,
					data: tokenMeta
				});
			}

			token.tokenDetails = nftTokenDetails;
			token.balance = nftTokenDetails.length;
			token.symbol = collectionData?.symbol;
			token.decimals = 0;

		// TODO: Rework this. I dunno how it got this bad but I think I was working around some inconsistencies in the discovery API
		// 	Rework so collection data API isn't required for erc20
		} else if (tokenData.length > 0) {
			token.name = tokenData[0].title;
			token.balance = tokenData[0].data?.balance ? BigInt(tokenData[0].data?.balance) : 0;
			token.symbol = tokenData[0].symbol;
			token.decimals = tokenData[0].data?.decimals;
		} else {
			token.name = collectionData.title;
			token.balance = 0;
			token.symbol = collectionData.symbol;
			token.decimals = collectionData.decimals;
			return token;
		}

		if (collectionData?.image)
			token.image = collectionData.image;

		token.symbol = tokenData[0]?.symbol ? tokenData[0]?.symbol : tokenData[0]?.data?.symbol;

		return token;
	}

	public async getTokensByOwner(token: ITokenCollection, ownerAddress: string){

		if (token.chainId === ChainID.HARDHAT_LOCALHOST){

			token = await this.fetchOwnerTokensRpc(token, ownerAddress);

			return token;
		}

		return await this.fetchOwnerTokens(token, CHAIN_MAP[token.chainId], ownerAddress);
	}

	public async getTokenById(token: ITokenCollection, tokenId: string){

		if (token.chainId === ChainID.HARDHAT_LOCALHOST){
			return await this.fetchTokenByIdRpc(token, tokenId);
		}

		const tokenUrl = `/get-token?chain=${CHAIN_MAP[token.chainId]}&collectionAddress=${token.contractAddress}&tokenId=${tokenId}`;

		const response = await fetch(BASE_TOKEN_DISCOVERY_URL + tokenUrl);

		if (!(response.status >= 200 && response.status <= 299)) {
			throw new Error("Failed to load token details");
		}

		const tokenMeta = await response.json()

		token.tokenDetails = [
			{
				collectionDetails: token,
				attributes: tokenMeta.attributes,
				collectionId: tokenMeta.collection,
				description: tokenMeta.description,
				image: tokenMeta.image || null,
				name: tokenMeta.name ?? tokenMeta.title,
				tokenId: tokenMeta.tokenId,
				balance: tokenMeta.balance
			}
		];

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

		if (!this.enableStorage)
			return false

		try {
			const tokenMeta = await dbProvider.tokenMeta2.where({
				chainId: token.chainId,
				collectionId: token.contractAddress.toLowerCase(),
				tokenType: token.tokenType
			}).first();

			if (tokenMeta && Date.now() < tokenMeta.dt + (COLLECTION_CACHE_TTL * 1000))
				return tokenMeta.data;
		} catch (e) {
			console.warn(e);
		}

		return false;
	}

	private async storeCachedMeta(token: ITokenCollection, data: any){

		if (!this.enableStorage)
			return;

		try {
			await dbProvider.tokenMeta2.put({
				chainId: token.chainId,
				collectionId: token.contractAddress.toLowerCase(),
				tokenType: token.tokenType,
				data,
				dt: Date.now()
			});
		} catch (e) {
			console.warn(e);
		}
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

		const contract = this.getEthersContractInstance(token.contractAddress, token.chainId, token.tokenType);


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
			try {
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
			} catch (e){
				console.error(e);
			}
		}

		return <ITokenCollection>{
			name: name ?? "Test collection",
			symbol: symbol,
			description: description ?? "",
			image,
		}
	}

	private async fetchTokenByIdRpc(token: ITokenCollection, tokenId: string) {

		const contract = this.getEthersContractInstance(token.contractAddress, token.chainId, token.tokenType);

		try {
			const meta = await this.fetchTokenMetaFromId(contract, tokenId);

			token.tokenDetails = [
				{
					collectionId: token.originId,
					tokenId: tokenId.toString(),
					name: meta.name ?? "Test token #" + tokenId,
					description: meta.description ?? "",
					image: meta.image,
					collectionDetails: token
				}
			];

		} catch (e){
			console.error(e);
		}

		return token;
	}

	private async fetchOwnerTokensRpc(token: ITokenCollection,  owner: string) {

		const contract = this.getEthersContractInstance(token.contractAddress, token.chainId, token.tokenType);

		// TODO: ERC-20 & token metadata
		const tokenDetails: ITokenDetail[] = [];

		try {

			if (token.tokenType === "erc20"){

				token.balance = BigInt(await contract.balanceOf(owner));

			} else {

				let tokenIds;

				try {
					tokenIds = await this.getTokenIdsLogs(contract, owner);
				} catch (e){
					tokenIds = await this.getTokenIdsEnumerable(contract, owner);
				}

				for (const tokenId of tokenIds){

					let meta: any = {};

					try {
						meta = await this.fetchTokenMetaFromId(contract, tokenId);
					} catch (e){
						console.warn("Failed to load token metadata:", e);
					}

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

				token.tokenDetails = tokenDetails;
				token.balance = tokenDetails.length;
			}

		} catch (e){
			console.error(e);
		}

		return token;
	}

	private async fetchTokenMetaFromId(contract: Contract, tokenId: string){

		const metaUri = await contract.tokenURI(tokenId);

		return await (await fetch(metaUri, {
			headers: {
				'Accept': 'text/plain'
			}
		})).json();
	}

	private async getTokenIdsEnumerable(contract, owner){

		const tokenIds = [];

		const balance = BigInt(await contract.balanceOf(owner));

		for (let i=0; i<balance; i++) {
			tokenIds.push(BigInt(await contract.tokenOfOwnerByIndex(owner, i)));
		}

		return tokenIds;
	}

	private async getTokenIdsLogs(contract, owner){

		const sentLogs = await contract.queryFilter(
			contract.filters.Transfer(owner, null),
		);
		const receivedLogs = await contract.queryFilter(
			contract.filters.Transfer(null, owner),
		);

		const logs = sentLogs.concat(receivedLogs)
			.sort(
				(a, b) =>
					a.blockNumber - b.blockNumber ||
					a.transactionIndex - b.transactionIndex,
			);

		const tokenIds = new Set();

		for (const { args: { from, to, tokenId } } of logs) {
			if (this.addressEqual(to, owner)) {
				tokenIds.add(tokenId.toString());
			} else if (this.addressEqual(from, owner)) {
				tokenIds.delete(tokenId.toString());
			}
		}

		return Array.from(tokenIds.values());
	}

	private addressEqual(a, b) {
		return a.toLowerCase() === b.toLowerCase();
	}

	private getEthersContractInstance(address: string, chainId: number, type: TokenType){
		const urls = CHAIN_CONFIG[chainId].rpc;
		const provider = new ethers.JsonRpcProvider(typeof urls === "string" ? urls : urls[0], chainId, { staticNetwork: new Network(chainId.toString(), chainId)});

		return new Contract(address, type === "erc20" ? ERC20_ABI_JSON : ERC721_ABI_JSON, provider);
	}

	private async fetchRequest(query: string){
		const response = await fetch(BASE_TOKEN_DISCOVERY_URL + query)
		const ok = response.status >= 200 && response.status <= 299
		if (!ok) {
			throw new Error("Failed to load tokens, please try again shortly: " + response.statusText);
		}

		return response.json();
	}
}

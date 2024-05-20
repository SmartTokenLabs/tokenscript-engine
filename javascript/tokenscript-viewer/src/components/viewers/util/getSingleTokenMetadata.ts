import {CHAIN_MAP} from "../../../integration/constants";
import {BASE_TOKEN_DISCOVERY_URL, DiscoveryAdapter} from "../../../integration/discoveryAdapter";
import {ITokenDetail} from "../../../../../engine-js/src/tokens/ITokenDetail";
import {ITokenCollection} from "../../../../../engine-js/src/tokens/ITokenCollection";
import {Web3WalletProvider} from "../../wallet/Web3WalletProvider";
import {TokenScriptEngine} from "../../../../../engine-js/src/Engine";

export const getSingleTokenMetadata = async (chain: number, contract: string, tokenId?: string, engine?: TokenScriptEngine, wallet?: string): Promise<{collection: ITokenCollection, detail?: ITokenDetail}> => {

	const discoveryAdapter = new DiscoveryAdapter(!engine.config.noLocalStorage);

	let selectedOrigin: ITokenCollection = {
		originId: "0",
		blockChain: "eth",
		tokenType: tokenId ? "erc721" : "erc20",
		chainId: chain,
		contractAddress: contract,
	}

	const meta = await discoveryAdapter.getCollectionMeta(selectedOrigin, CHAIN_MAP[chain])

	selectedOrigin = {
		...selectedOrigin,
		...meta,
		name: meta.title
	};

	if (selectedOrigin.tokenType !== "erc20") {

		const tokenUrl = `/get-token?chain=${CHAIN_MAP[chain]}&collectionAddress=${contract}&tokenId=${tokenId}`;

		const response = await fetch(BASE_TOKEN_DISCOVERY_URL + tokenUrl);

		if (!(response.status >= 200 && response.status <= 299)) {
			throw new Error("Failed to load token details");
		}

		const tokenMeta =  await response.json()

		selectedOrigin.tokenDetails = [
			{
				collectionDetails: selectedOrigin,
				attributes: tokenMeta.attributes,
				collectionId: tokenMeta.collection,
				description: tokenMeta.description,
				image: tokenMeta.image,
				name: tokenMeta.title,
				tokenId: tokenMeta.tokenId,
				balance: tokenMeta.balance
			}
		]

	} else {

		if (!wallet && !engine && !Web3WalletProvider.isWalletConnected()){
			return {collection: selectedOrigin, detail: null};
		}

		const tokenData = await discoveryAdapter.getTokensByOwner(
			selectedOrigin,
			wallet ? wallet : (engine ? await (await engine.getWalletAdapter()).getCurrentWalletAddress() : await discoveryAdapter.getCurrentWalletAddress())
		);

		//console.log("Fungible token data: ", tokenData);

		selectedOrigin.balance = tokenData.length && tokenData[0].data?.balance ? BigInt(tokenData[0].data?.balance) : 0;
		if (!selectedOrigin.name && tokenData[0]?.title)
			selectedOrigin.name = tokenData[0].title;
	}

	if (tokenId){
		return {collection: selectedOrigin, detail: selectedOrigin.tokenDetails[0]};
	}

	return {collection: selectedOrigin, detail: null};
}

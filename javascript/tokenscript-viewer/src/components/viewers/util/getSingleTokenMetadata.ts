import {CHAIN_MAP} from "../../../integration/constants";
import {DiscoveryAdapter} from "../../../integration/discoveryAdapter";
import {ITokenDetail} from "../../../../../engine-js/src/tokens/ITokenDetail";
import {ITokenCollection} from "../../../../../engine-js/src/tokens/ITokenCollection";
import {Web3WalletProvider} from "../../wallet/Web3WalletProvider";
import {ITokenScriptEngine} from "../../../../../engine-js/src/IEngine";

export const getSingleTokenMetadata = async (chain: number, contract: string, tokenId?: string, engine?: ITokenScriptEngine, wallet?: string): Promise<{collection: ITokenCollection, detail?: ITokenDetail}> => {

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

	if (meta.contractType)
		selectedOrigin.tokenType = meta.contractType.toLowerCase();

	if (selectedOrigin.tokenType !== "erc20") {

		selectedOrigin = await discoveryAdapter.getTokenById(selectedOrigin, tokenId);

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

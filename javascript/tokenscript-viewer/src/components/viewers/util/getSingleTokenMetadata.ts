import {CHAIN_MAP} from "../../../integration/constants";
import {BASE_TOKEN_DISCOVERY_URL} from "../../../integration/discoveryAdapter";
import {ITokenDetail} from "../../../../../engine-js/src/tokens/ITokenDetail";
import {TokenType} from "../../../../../engine-js/src/tokens/ITokenCollection";

export const getSingleTokenMetadata = async (chain: number, contract: string, tokenId: string): Promise<ITokenDetail> => {

	const collectionUrl = `/get-token-collection?chain=${CHAIN_MAP[chain]}&smartContract=${contract}`;
	const tokenUrl = `/get-token?chain=${CHAIN_MAP[chain]}&collectionAddress=${contract}&tokenId=${tokenId}`;

	const responses = await Promise.all([
		fetch(BASE_TOKEN_DISCOVERY_URL + collectionUrl),
		await fetch(BASE_TOKEN_DISCOVERY_URL + tokenUrl)
	]);

	const ok = (
		(responses[0].status >= 200 && responses[0].status <= 299) &&
		(responses[1].status >= 200 && responses[1].status <= 299)
	)
	if (!ok) {
		throw new Error("Failed to load token details");
	}

	const tokenMeta =  {
		collectionData: await responses[0].json(),
		...await responses[1].json()
	}

	return {
		attributes: tokenMeta.attributes,
		collectionDetails: {
			originId: "",
			blockChain: "eth",
			chainId: chain,
			tokenType: tokenMeta.collectionData.contractType.toLowerCase() as TokenType,
			contractAddress: contract,
			name: tokenMeta.collectionData.title as string,
			description: tokenMeta.collectionData.description as string,
			image: tokenMeta.collectionData.image as string,
			balance: tokenMeta.balance
		},
		collectionId: tokenMeta.collection,
		description: tokenMeta.description,
		image: tokenMeta.image,
		name: tokenMeta.title,
		tokenId: tokenMeta.tokenId,
		balance: tokenMeta.balance
	}
}

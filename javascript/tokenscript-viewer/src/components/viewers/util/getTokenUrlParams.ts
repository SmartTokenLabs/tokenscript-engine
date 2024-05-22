
export function getTokenUrlParams(query?: URLSearchParams){

	if (!query) {
		const queryStr = document.location.search.substring(1);

		if (!queryStr)
			throw new Error("Cannot load: No URL parameters supplied");

		query = new URLSearchParams(queryStr);
	}

	if (!query.has("chain") || !query.has("contract"))
		throw new Error("Cannot load: chain or contract URL parameters not supplied");

	const chain: number = parseInt(query.get("chain"));

	if (!chain)
		throw new Error("Cannot load: invalid chain in URL parameter");

	const contract: string = query.get("contract");
	let tokenId: string|null = query.get('tokenId');

	if (tokenId && tokenId.toLowerCase() === "erc20")
		tokenId = null;

	return {
		query,
		chain,
		contract,
		tokenId,
		tokenscriptUrl: query.get("tokenscriptUrl"),
		wallet: query.get('wallet') // Used to override the wallet address used for display of erc20
	}
}

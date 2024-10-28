
export function getTokenUrlParams(query?: URLSearchParams, mustHaveChainAndContract = true){

	if (!query) {
		const queryStr = document.location.search.substring(1);

		if (!queryStr && mustHaveChainAndContract)
			throw new Error("Cannot load: No URL parameters supplied");

		query = new URLSearchParams(queryStr);

		const hashParams = new URLSearchParams(document.location.hash.substring(1));

		for (const key of ["originId", "tokenId", "card"]){
			if (!query.has(key) && hashParams.has(key))
				query.set(key, hashParams.get(key));
		}
	}

	if (mustHaveChainAndContract && (!query.has("chain") || !query.has("contract")))
		throw new Error("Cannot load: chain or contract URL parameters not supplied");

	const chain: number = parseInt(query.get("chain")) ?? 0;

	if (mustHaveChainAndContract && !chain)
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
		scriptId: query.get("scriptId"),
		originId: query.get("originId"),
		tokenscriptUrl: query.get("tokenscriptUrl"),
		emulator: query.get("emulator"),
		wallet: query.get('wallet'), // Used to override the wallet address used for display of erc20
		card: query.get("card")
	}
}

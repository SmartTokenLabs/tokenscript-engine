import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";

export type TokenGridContext = (ITokenDetail | ITokenCollection) & { contextId: string; };

// TODO: Improve engine APIs so this is not required
export function getTokensFlat(tokens: {[name: string]: ITokenCollection}): TokenGridContext[] {

	return Object.keys(tokens).reduce((tokenArr, contractName) => {

		if (tokens[contractName].tokenDetails){

			// NFTs
			const nfts = tokens[contractName].tokenDetails.map((nft, index) => {
				return {...nft, contextId: contractName + "-" + index};
			});
			tokenArr.push(...nfts);
		} else {
			// fungible token with balance
			const flatToken = {...tokens[contractName], contextId: contractName};
			tokenArr.push(flatToken);
		}

		return tokenArr;

	}, [])
}

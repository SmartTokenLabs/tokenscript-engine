import {INFTTokenDetail} from "@tokenscript/engine-js/src/tokens/INFTTokenDetail";
import {IToken} from "@tokenscript/engine-js/src/tokens/IToken";

export type TokenGridContext = (INFTTokenDetail | IToken) & { contextId: string; };

// TODO: Improve engine APIs so this is not required
export function getTokensFlat(tokens: {[name: string]: IToken}): TokenGridContext[] {

	return Object.keys(tokens).reduce((tokenArr, contractName) => {

		if (tokens[contractName].nftDetails){

			// NFTs
			const nfts = tokens[contractName].nftDetails.map((nft, index) => {
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

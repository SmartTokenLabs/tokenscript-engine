import {TokenScript} from "@tokenscript/engine-js/src";

export async function getSelectedOriginTokenFromUrlParams(tokenScript: TokenScript, chain: number, contract: string, originId?: string, tokenId?: string, returnDefault = false){

	const origins = tokenScript.getTokenOriginData();

	for (const origin of origins) {

		if (originId && originId === origin.originId){
			return origin;
		}

		if (
			origin.chainId === chain &&
			origin.contractAddress.toLowerCase() === contract.toLowerCase() &&
			// This is required to handle ST404, where both the erc20 & 721 contract origins are included in the same tokenscript
			((tokenId === null && origin.tokenType === "erc20") || (tokenId !== null && origin.tokenType !== "erc20"))
		) {
			return origin;
		}
	}

	if (returnDefault){
		console.log("Could not find token origin in the tokenscript for the provided contract and chain");
		return origins[0];
	}

	throw new Error("Could not find token origin in the tokenscript");
}

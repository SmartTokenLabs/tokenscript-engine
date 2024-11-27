import {ITokenCollection} from "../../../../../engine-js/src/tokens/ITokenCollection";
import {ITokenDiscoveryAdapter} from "../../../../../engine-js/src/tokens/ITokenDiscoveryAdapter";
import {AppRoot} from "../../app/app";
import {ITokenDetail} from "../../../../../engine-js/src/tokens/ITokenDetail";
import {getSingleTokenMetadata} from "./getSingleTokenMetadata";
import {getTokenScriptFromUrlParams} from "./getTokenScriptFromUrlParams";
import {getSelectedOriginTokenFromUrlParams} from "./getSelectedOriginTokenFromUrlParams";

export async function getTokenScriptWithSingleTokenContext(
	app: AppRoot,
	chain: number,
	contract: string,
	scriptId?: string,
	originId?: string,
	collectionDetails?: ITokenCollection,
	tokenDetails?: ITokenDetail,
	tokenId?: string,
	tokenScriptUrl?: string
) {

	let tokenScript = await getTokenScriptFromUrlParams(app, chain, contract, scriptId, tokenScriptUrl);

	let selectedOrigin = await getSelectedOriginTokenFromUrlParams(tokenScript, chain, contract, originId, tokenId, !collectionDetails && !tokenId && !originId);

	if (collectionDetails) {
		selectedOrigin = {...collectionDetails, ...selectedOrigin}
		if (tokenDetails)
			selectedOrigin.tokenDetails = [tokenDetails];
	} else {

		// If token ID is specified we only show that token
		if (tokenId != null){
			// Try to load single token
			const singleTokenData = await getSingleTokenMetadata(selectedOrigin.chainId, selectedOrigin.contractAddress, tokenId, tokenScript.getEngine());

			// If name isn't provided let's fall back to the name specified in the
			if (!singleTokenData.collection.name)
				singleTokenData.collection.name = selectedOrigin.originId;

			selectedOrigin = {...singleTokenData.collection, ...selectedOrigin}
			if (singleTokenData.detail)
				selectedOrigin.tokenDetails = [singleTokenData.detail];

		} else {
			const tokens = await tokenScript.getTokenMetadata(true);
			selectedOrigin = {...tokens[selectedOrigin.originId], ...selectedOrigin};
		}
	}

	tokenScript.setTokenMetadata([selectedOrigin]);

	if (collectionDetails || tokenId != null) {
		class StaticDiscoveryAdapter implements ITokenDiscoveryAdapter {
			getTokens(initialTokenDetails: ITokenCollection[], refresh: boolean): Promise<ITokenCollection[]> {
				return Promise.resolve([selectedOrigin]);
			}
		}

		//app.discoveryAdapter = new StaticDiscoveryAdapter();
		tokenScript.setTokenDiscoveryAdapter(new StaticDiscoveryAdapter());
	}

	tokenScript.setCurrentTokenContext(selectedOrigin.originId, null, selectedOrigin.tokenType !== "erc20" ? tokenId : null);

	return tokenScript;
}

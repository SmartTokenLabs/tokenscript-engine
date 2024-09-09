import {TokenScript} from "../../../../../engine-js/src/TokenScript";
import {ITokenCollection} from "../../../../../engine-js/src/tokens/ITokenCollection";
import {ITokenDiscoveryAdapter} from "../../../../../engine-js/src/tokens/ITokenDiscoveryAdapter";
import {AppRoot} from "../../app/app";
import {ITokenDetail} from "../../../../../engine-js/src/tokens/ITokenDetail";


export async function getTokenScriptWithSingleTokenContext(
	app: AppRoot,
	chain: number,
	contract: string,
	collectionDetails?: ITokenCollection,
	tokenDetails?: ITokenDetail,
	tokenId?: string,
	tokenScriptUrl?: string
) {

	let tokenScript: TokenScript;

	if (tokenScriptUrl) {

		// TODO: Remove this fix once AlphaWallet is updated to support embedded TS viewer for newer schema versions
		if (tokenScriptUrl === "https://viewer.tokenscript.org/assets/tokenscripts/smart-cat-prod.tsml"){
			console.log("SmartCat tokenscript detected, using updated version for newer features and better performance");
			tokenScriptUrl = "/assets/tokenscripts/smart-cat-prod-2024-01.tsml";
		} else if (tokenScriptUrl === "https://viewer-staging.tokenscript.org/assets/tokenscripts/smart-cat-mumbai.tsml"){
			console.log("SmartCat tokenscript detected, using updated version for newer features and better performance");
			tokenScriptUrl = "/assets/tokenscripts/smart-cat-mumbai-2024-01.tsml";
		} else if (tokenScriptUrl === "https://viewer.tokenscript.org/assets/tokenscripts/smart-cat-loot-prod.tsml"){
			// Always use staging version on staging site
			tokenScriptUrl = "/assets/tokenscripts/smart-cat-loot-prod.tsml";
		}

		tokenScript = await app.loadTokenscript("url", tokenScriptUrl);
	} else {
		const tsId = chain + "-" + contract;
		tokenScript = await app.loadTokenscript("resolve", tsId);
	}

	const origins = tokenScript.getTokenOriginData();
	let selectedOrigin: ITokenCollection;

	for (const origin of origins) {
		if (
			origin.chainId === chain &&
			origin.contractAddress.toLowerCase() === contract.toLowerCase() &&
			// This is required to handle ST404, where both the erc20 & 721 contract origins are included in the same tokenscript
			((tokenId === null && origin.tokenType === "erc20") || (tokenId !== null && origin.tokenType !== "erc20"))
		) {
			selectedOrigin = {
				...origin
			}

			break;
		}
	}

	if (!selectedOrigin)
		throw new Error("Could not find token origin in the tokenscript");

	if (collectionDetails) {
		selectedOrigin = {...collectionDetails, ...selectedOrigin}
		if (tokenDetails)
			selectedOrigin.tokenDetails = [tokenDetails];
	} else {

		const tokens = await tokenScript.getTokenMetadata(true);

		console.log(tokens);

		console.log(selectedOrigin);

		if (!tokens[selectedOrigin.originId])
			throw new Error("Could not load token metadata");

		selectedOrigin = {...tokens[selectedOrigin.originId], ...selectedOrigin};
	}

	tokenScript.setTokenMetadata([selectedOrigin]);

	let tokenIndex = 0;

	if (collectionDetails) {
		class StaticDiscoveryAdapter implements ITokenDiscoveryAdapter {
			getTokens(initialTokenDetails: ITokenCollection[], refresh: boolean): Promise<ITokenCollection[]> {
				return Promise.resolve([selectedOrigin]);
			}
		}

		//app.discoveryAdapter = new StaticDiscoveryAdapter();
		tokenScript.setTokenDiscoveryAdapter(new StaticDiscoveryAdapter());
	} else {

		tokenIndex = selectedOrigin.tokenDetails.findIndex((token) => token.tokenId === tokenId);

		if (tokenIndex === -1)
			tokenIndex = 0; // For now just select the first token if the token ID is not found
	}

	tokenScript.setCurrentTokenContext(selectedOrigin.originId, selectedOrigin.tokenType !== "erc20" ? tokenIndex : null);

	return tokenScript;
}

import {AppRoot} from "../../app/app";
import {getTokenScriptFromUrlParams} from "./getTokenScriptFromUrlParams";
import {getSelectedOriginTokenFromUrlParams} from "./getSelectedOriginTokenFromUrlParams";
import {getSingleTokenMetadata} from "./getSingleTokenMetadata";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {DiscoveryAdapter} from "../../../integration/discoveryAdapter";
import {TokenScriptEngine} from "@tokenscript/engine-js/src";

export async function getTokenScriptWithProvidedTokenContext(
	app: AppRoot,
	chain: number,
	contract: string,
	scriptId?: string,
	originId?: string,
	tokenId?: string,
	tokenScriptUrl?: string
){

	let tokenScript = await getTokenScriptFromUrlParams(app, chain, contract, scriptId, tokenScriptUrl);

	let selectedOrigin = await getSelectedOriginTokenFromUrlParams(tokenScript, chain, contract, originId, tokenId, !tokenId);

	console.log("Selected origin: ", selectedOrigin);

	class AddSingleTokenAdapter extends DiscoveryAdapter {

		providedTokenIdDetails: ITokenDetail;

		constructor(engine: TokenScriptEngine) {
			super(!engine.config.noLocalStorage);
			this.engine = engine;
		}

		async getTokens(initialTokenDetails: ITokenCollection[], refresh: boolean) {
			const collections = await super.getTokens(initialTokenDetails, refresh);

			console.log("Collections: ", collections);

			selectedOrigin = collections.find((collection) => collection.originId === selectedOrigin.originId);

			if (tokenId != null && !this.providedTokenIdDetails){
				if (selectedOrigin.tokenDetails.find((token) => token.tokenId === tokenId))
					return collections;

				// The provided tokenID is not owned by the current wallet, so we fetch it separately
				this.providedTokenIdDetails = (await getSingleTokenMetadata(chain, contract, tokenId, tokenScript.getEngine())).detail;
			}

			if (this.providedTokenIdDetails){
				selectedOrigin.tokenDetails.unshift(this.providedTokenIdDetails);
			}


			return collections;
		}
	}

	tokenScript.setTokenDiscoveryAdapter(new AddSingleTokenAdapter(app.tsEngine));

	await tokenScript.getTokenMetadata(true);

	tokenScript.setCurrentTokenContext(selectedOrigin.originId, null, selectedOrigin.tokenType !== "erc20" ? tokenId : null);

	return tokenScript;
}

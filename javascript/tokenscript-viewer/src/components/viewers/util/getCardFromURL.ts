import {findCardByUrlParam} from "./findCardByUrlParam";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";

export const getCardFromURL = (tokenScript: TokenScript) => {

	const params = new URLSearchParams(document.location.hash.substring(1));

	if (!params.has("card"))
		return null;

	const action = params.get("card");

	const cardRes = findCardByUrlParam(action, tokenScript);

	return {card: cardRes?.card, action};
};

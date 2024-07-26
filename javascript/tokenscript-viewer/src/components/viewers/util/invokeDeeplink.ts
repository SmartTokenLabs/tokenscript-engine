import {getCardFromURL} from "./getCardFromURL";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {ShowToastEventArgs} from "../../app/app";
import {EventEmitter} from "@stencil/core";

export const invokeDeeplink = async (tokenScript: TokenScript, showToast: EventEmitter<ShowToastEventArgs>, showCard: (card: Card) => void) => {

	const cardRes = getCardFromURL(tokenScript);

	if (!cardRes)
		return;

	if (!cardRes.card){
		showToast.emit({
			type: 'error',
			title: "Card not found",
			description: "The card '" + cardRes.action + "' cannot be found."
		});
		return;
	}

	const enabledOrReason = await cardRes.card.isEnabledOrReason();

	if (enabledOrReason === true) {
		await showCard(cardRes.card);
		return;
	}

	showToast.emit({
		type: 'error',
		title: "Action not allowed",
		description: `The ${cardRes.action} action is not available. ${enabledOrReason !== false ? enabledOrReason : ''}`
	});
}

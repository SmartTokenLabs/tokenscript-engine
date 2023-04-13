import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";

export function findCardByUrlParam(id: string, tokenScript: TokenScript){

	const cards = tokenScript.getCards();

	for (let [index, card] of cards.entries()){
		if (card.name == id)
			return {card, index};
	}

	const index = parseInt(id);

	if (!isNaN(index) && cards[index])
		return {card: cards[index], index};

	return null;
}

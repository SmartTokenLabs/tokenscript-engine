import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";

// TODO: Improve engine APIs so this is not required
export function findCardByUrlParam(id: string, tokenScript: TokenScript){

	const cards = tokenScript.getCards().getAllCards();

	for (let [index, card] of cards.entries()){
		if (card.name == id)
			return {card, index};
	}

	const index = parseInt(id);

	if (!isNaN(index) && cards[index])
		return {card: cards[index], index};

	return null;
}

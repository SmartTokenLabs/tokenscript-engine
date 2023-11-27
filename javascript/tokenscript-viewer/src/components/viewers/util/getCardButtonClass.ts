import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";

export const getCardButtonClass = (card: Card, index: number) => {

	switch (card.buttonClass){
		case "featured":
			return "btn-featured";
		case "primary":
			return "btn-primary";
		case "secondary":
			return "btn-secondary";
		default:
			return card.type === "token" || index === 0 ? "btn-primary" : "btn-secondary";
	}
}

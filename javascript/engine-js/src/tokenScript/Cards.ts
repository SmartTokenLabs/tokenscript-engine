import {ITokenScript} from "../ITokenScript";
import {Card} from "./Card";

export class Cards implements Iterable<Card | undefined> {

	private cards?: {[cardName: string]: Card};

	constructor(private tokenScript: ITokenScript) {

	}

	/**
	 * Load mapping of name=>Card
	 */
	public getCardsMap(): {[cardName: string]: Card} {

		if (!this.cards) {

			let cardsXml = this.tokenScript.tokenDef.documentElement.getElementsByTagName("ts:card");

			this.cards = {};

			for (let i in cardsXml) {

				if (!cardsXml.hasOwnProperty(i))
					continue;

				const card = new Card(this.tokenScript, cardsXml[i]);

				this.cards[card.name] = card;
			}
		}

		return this.cards;
	}

	/**
	 * Get all cards
	 */
	public getAllCards(){
		return Object.values<Card>(this.getCardsMap())
	}

	/**
	 * Returns a filtered array of cards for the TokenScript.
	 * @param tokenOrigin Use the specified origin name if provided, otherwise fallback to current context origin
	 * @param includedTypes An array of types to include. By default, all types are included except for onboarding and public cards
	 */
	public filterCards(tokenOrigin?: string, includedTypes?: string[]): Card[] {

		if (!tokenOrigin)
			tokenOrigin = this.tokenScript.getCurrentTokenContext()?.originId;

		let cards = Object.values(this.getCardsMap());

		// Don't include onboarding & public cards by default
		if (includedTypes && includedTypes.length){
			cards = cards.filter((card) => includedTypes.indexOf(card.type) > -1);
		} else {
			cards = cards.filter((card) => card.type !== "onboarding" && card.type !== "public");
		}

		// Only return cards available for the specified token origins
		if (tokenOrigin){
			cards = cards.filter((card) => {
				return card.origins.length === 0 || card.origins.indexOf(tokenOrigin) > -1;
			});
		}

		return cards;
	}

	/**
	 * Returns onboarding cards
	 */
	public getOnboardingCards(): Card[] {
		return this.filterCards(undefined, ["onboarding"])
	}

	/**
	 *
	 * @param tokenOrigin Use the specified origin name if provided, otherwise fallback to current context origin
	 */
	public getPublicCards(tokenOrigin?: string){
		return this.filterCards(tokenOrigin, ["public"])
	}

	/**
	 * Returns the card object with the provided name
	 * @param name The card name as defined by the "name" object in the XML
	 */
	getCardByName(name: string) {

		const cards = this.getCardsMap();

		if (!cards[name])
			throw new Error("Card with name " + name + " was not found in the TSML");

		return cards[name];
	}

	/**
	 * The iterator returns only user cards by default
	 */
	[Symbol.iterator](): Iterator<Card | undefined> {
		return this.filterCards().values();
	}
}

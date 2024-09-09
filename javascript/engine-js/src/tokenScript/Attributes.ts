import {ITokenScript} from "../ITokenScript";
import {Attribute} from "./Attribute";

/**
 * Attributes represents a specific collection of attribute within the TokenScript XML that are all siblings.
 * These can either be a collection of global attributes (under ts:token) or attribute for a specific card (ts:card)
 */
export class Attributes implements Iterable<Attribute | undefined> {

	private attributes: {[attributeName: string]: Attribute };

	constructor(private tokenScript: ITokenScript, private parentElem: Element, private isCardContext = false) {

	}

	/**
	 * Gets an object of attributes, keyed by attribute name
	 */
	getAttributes(): {[attributeName: string]: Attribute } {

		if (!this.attributes){

			this.attributes = {};

			// Only get direct child attributes. global & card level attributes may have the same name within the same scope
			const attrElems = Array.prototype.slice.call(this.parentElem.children).filter((elem: Element) => {
				return elem.tagName === "ts:attribute"
			});

			if (attrElems.length > 0){
				for (let i in attrElems){

					const att = new Attribute(this.tokenScript, attrElems[i], this.isCardContext ? this : null);

					this.attributes[att.getName()] = att;
				}
			}
		}

		return this.attributes;
	}

	/**
	 * Get attribute by name
	 * @param name
	 * @throws Error when the attribute does not exist
	 */
	getAttribute(name: string): Attribute {

		if (!this.attributes)
			this.getAttributes();

		if (!this.attributes[name])
			throw new Error("Could not find attribute '" + name + "'");

		return this.attributes[name];
	}

	/**
	 * Does the supplied attribute exist in this attribute collection
	 * @param name
	 */
	hasAttribute(name: string){
		if (!this.attributes)
			this.getAttributes();

		return this.attributes.hasOwnProperty(name);
	}

	/**
	 * Invalidate attribute values
	 * @param dependentOn only invalidate those which match, or are dependent on any of the supplied attribute names
	 */
	invalidate(dependentOn?: string[]){
		for (let attr of this){
			attr.invalidate(dependentOn);
		}
	}

	[Symbol.iterator](): Iterator<Attribute | undefined> {
		return Object.values(this.getAttributes()).values();
	}
}

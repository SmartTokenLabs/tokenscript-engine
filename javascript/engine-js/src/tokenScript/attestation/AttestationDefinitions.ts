import {AttestationDefinition} from "./AttestationDefinition";
import {TokenScript} from "../../TokenScript";
import {Attribute} from "../Attribute";

export class AttestationDefinitions {

	private definitions?: {[attestationName: string]: AttestationDefinition };

	constructor(
		private tokenScript: TokenScript,
		private elem: Element
	) {

	}

	/**
	 * Gets an object of attestation definitions, keyed by attribute name
	 */
	getDefinitions(): {[attestationName: string]: AttestationDefinition } {

		if (!this.definitions){

			this.definitions = {};

			const defElems = Array.prototype.slice.call(this.elem.children).filter((elem: Element) => {
				return elem.tagName === "ts:attestation"
			});

			for (const defElem of defElems){
				const definition = new AttestationDefinition(this.tokenScript, defElem);
				this.definitions[definition.name] = definition;
			}

		}

		return this.definitions;
	}

	getDefinition(name: string): AttestationDefinition {
		const definitions = this.getDefinitions();
		return definitions[name];
	}

	[Symbol.iterator](): Iterator<AttestationDefinition | undefined> {
		return Object.values(this.getDefinitions()).values();
	}
}

import {TokenScript} from "../../TokenScript";
import {sha256} from "ethers/lib/utils";

export interface AttestationMeta {
	title: string,
	image: string,
	description: string
}

export class AttestationDefinition {

	constructor(
		private tokenScript: TokenScript,
		private elem: Element
	) {

	}

	getTokenScript(){
		return this.tokenScript
	}

	get name(){
		return this.elem.getAttribute("name");
	}

	get type(){
		return this.elem.getAttribute("type");
	}

	get meta(): AttestationMeta {
		const meta = this.elem.getElementsByTagName("ts:meta")?.[0];

		if (!meta)
			return {
				title: this.tokenScript.getLabel(),
				image: "",
				description: ""
			}

		return {
			title: meta.getElementsByTagName("ts:title")?.[0].innerHTML ?? this.tokenScript.getLabel(),
			image: meta.getElementsByTagName("ts:image")?.[0].innerHTML ?? "",
			description: meta.getElementsByTagName("ts:title")?.[0].innerHTML ?? "",
		}
	}

	get keys(): string[] {

		const keys = [];
		const keyElems = this.elem.getElementsByTagName("ts:key");

		for (const keyElem of keyElems){
			keys.push(keyElem.innerHTML);
		}

		return keys;
	}

	get eventId(): string {
		return this.elem.getElementsByTagName("ts:eventId")?.[0].innerHTML ?? null
	}

	get idFields(): string[] {
		const idElems = this.elem.getElementsByTagName("ts:idFields");

		if (!idElems.length)
			return [];

		return idElems[0].innerHTML.split(",") ?? []
	}

	get schemaUID(): string {

		const easElem = this.elem.getElementsByTagName("ts:eas");
		if (easElem.length){
			if (easElem[0].hasAttribute("schemaUID")){
				return easElem[0].getAttribute("schemaUID");
			}
		}

		return "0x0000000000000000000000000000000000000000000000000000000000000000";
	}

	public calculateAttestationCollectionHashes(): string[] {

		const hashes = [];

		let schemaUID = this.schemaUID;

		if (schemaUID.indexOf("0x") === 0)
			schemaUID = schemaUID.substring(2);

		const encoder = new TextEncoder();

		for (let key of this.keys){

			if (key.indexOf("0x") === 0)
				key = key.substring(2);

			const hashText = schemaUID + "-" + key + (this.eventId ? "-" + this.eventId : '');

			const hash = sha256(encoder.encode(hashText));

			hashes.push(hash);
		}

		return hashes;
	}
}

import {TokenScript} from "../../TokenScript";

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
		return Array.of(...this.elem.getElementsByTagName("ts:key")).map((keyElem: Element) => {
			return keyElem.innerHTML
		})
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

	get schemaUid(): string {
		return this.elem.getElementsByTagName("ts:eas")?.[0].innerHTML ?? "0x0000000000000000000000000000000000000000000000000000000000000000";
	}
}

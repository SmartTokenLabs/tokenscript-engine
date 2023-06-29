
export type OriginType = "contract"|"attestation"

export class Origin {

	constructor(
		private tokenScript,
		public name: string,
		public type: OriginType
	) {

	}
}

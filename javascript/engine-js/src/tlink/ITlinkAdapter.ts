
export interface TLinkRequest {
	uid: string,
	method: string,
	payload: Object
}

export type ITlinkAdapter = (request: TLinkRequest) => Promise<any>;

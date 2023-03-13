import {IToken} from "./IToken";

/**
 * Represents a specific non-fungible token
 */
export interface INFTTokenDetail {
	collectionDetails: IToken;
	tokenId: string;
	name: string;
	description: string;
	image?: string;
	attributes?: any[]
	data?: any;
}

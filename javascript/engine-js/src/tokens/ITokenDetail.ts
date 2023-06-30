import {ITokenCollection, TokenType} from "./ITokenCollection";
import {IAttestationData} from "../attestation/IAttestationStorageAdapter";

/**
 * Represents a specific non-fungible token
 */
export interface ITokenDetail {
	collectionDetails: ITokenCollection;
	collectionId: string;
	tokenId: string;
	name: string;
	description: string;
	image?: string;
	attributes?: [];
	data?: IAttestationData | any;
}

export interface ITokenDetailData {
	collectionId: string; // Contract address or attestation collection hash.
	tokenId: string; // Duplicated,
	type: TokenType;
	// Token specific metadata. For NFTs this is the standard NFT metadata.
	name: string
	image: string
	description: string,
	// For attestations, attributes array is prefilled with attribute data,
	// with labels defined in "visibleIdField" elements in attribute definition (James's proposal)
	attributes?: {trait_type: string, value: any}[]
	data?: IAttestationData | any;
}

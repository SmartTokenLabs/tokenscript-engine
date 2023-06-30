import {ITokenCollection} from "./ITokenCollection";
import {IAttestationData} from "../attestation/IAttestationStorageAdapter";
import {SignedOffchainAttestation} from "@ethereum-attestation-service/eas-sdk";

/**
 * Represents a specific non-fungible token
 */
export interface ITokenDetail {
	collectionDetails: ITokenCollection;
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
	type: "eas"|"erc721";
	// Token specific metadata. For NFTs this is the standard NFT metadata.
	name: string
	image: string
	description: string,
	// For attestations, attributes array is prefilled with attribute data,
	// with labels defined in "visibleIdField" elements in attribute definition (James's proposal)
	attributes?: {trait_type: string, value: any}[]
	data?: IAttestationData | any;
}

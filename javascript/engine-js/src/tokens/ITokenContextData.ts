import {SignedOffchainAttestation} from "@ethereum-attestation-service/eas-sdk";
import {ITokenDetailData} from "./ITokenDetail";

/**
 * The data that is injected into a tokenscript card, and can be used as transaction arguments.
 * These intrinsic values take precedence over attributes defined with the same name
 */
// TODO: Confirm all questions in comments
export interface ITokenContextData {
	name: string; // Collection or token level name?
	description?: string; // Collection or token level description?
	label: string; // Should this be the label of the TokenScript?
	symbol?: string;
	_count?: number, // Should this be changed to balance? This is how I am currently setting it
	contractAddress?: string; // Only set for blockchain tokens
	chainId: number; // Should this be the chain of the attestation too?
	tokenId?: number|string; // In the case of attestations, this is the ID generated using idFields in the attestation definition
	ownerAddress: string; // The owner of the blockchain token OR the recipient field in an attestation
	image_preview_url?: string; // Collection or token level image?
	/*attributes: {
		[attributeName: string]: any // A collection of TokenScript XML attributes & user-input values
	}*/
	[attributeName: string]: any
	// Token info contains different values depending on whether attestation or blockchain token, but the specified values are always available
	// NOT specified for fungible tokens
	tokenInfo?: ITokenDetailData
	// Is it a good idea putting these here? If we implement dot notation for transaction arguments then it's a bit redundant
	attestation?: string;
	signature?: string;
}

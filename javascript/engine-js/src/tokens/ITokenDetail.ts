import {ITokenCollection} from "./ITokenCollection";
import {IAttestationData} from "../attestation/IAttestationStorageAdapter";

/**
 * Represents a specific non-fungible token
 */
export interface ITokenDetail {
	collectionDetails: ITokenCollection;
	tokenId: string;
	name: string;
	description: string;
	image?: string;
	data?: IAttestationData | any;
}

// Note: These types are copied from the engine - I tried to link them but for some reason Jetbrains IDEs
// don't pick up types in transitive libraries for autocomplete

import {SignedOffchainAttestation} from "@ethereum-attestation-service/eas-sdk";

export interface ITokenContextData {
	name: string;
	description?: string;
	label: string;
	symbol?: string;
	_count?: string;
	contractAddress?: string;
	chainId: number;
	tokenId?: number | string;
	ownerAddress: string;
	image_preview_url?: string;
	[attributeName: string]: any;
	tokenInfo?: ITokenDetailData;
	attestation?: string;
	attestationSig?: string;
}

export interface ITokenDetail {
	collectionDetails: ITokenCollection;
	collectionId: string;
	tokenId: string;
	name: string;
	description: string;
	image?: string;
	attributes?: NFTAttribute[];
	data?: IAttestationData | any;
	balance?: string;
}
export interface NFTAttribute {
	trait_type: string;
	display_type?: string;
	value: string;
}
export interface ITokenDetailData {
	collectionId: string;
	tokenId: string;
	type: TokenType;
	name: string;
	image: string;
	description: string;
	attributes?: {
		trait_type: string;
		value: any;
	}[];
	data?: IAttestationData & any;
}

export type TokenType = "erc20" | "erc721" | "erc1155" | "eas";
export type BlockChain = "eth" | "offchain";
export interface ITokenCollection {
	originId: string;
	blockChain: BlockChain;
	chainId: number;
	tokenType: TokenType;
	contractAddress?: string;
	name?: string;
	description?: string;
	symbol?: string;
	decimals?: number;
	balance?: number | bigint;
	image?: string;
	tokenDetails?: ITokenDetail[];
	data?: any;
}

export interface IAttestationData {
	collectionId: string;
	tokenId: string;
	type: "eas";
	token: string;
	decodedToken: SignedOffchainAttestation;
	decodedData: {
		[name: string]: any;
	};
	meta: {
		[name: string]: any;
	};
	authoritativeTokenScript: {
		tsId: string;
		source: ScriptSourceType;
	};
	dt: number;
}

export declare enum ScriptSourceType {
	SCRIPT_URI = "scriptUri",
	URL = "url",
	UNKNOWN = "unknown"
}
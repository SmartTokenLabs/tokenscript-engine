/**
 * This is the top level token interface. In ethereum it represents a contract/collection.
 * NFTs have child token details whilst FTs only have a balance
 */
import {ITokenDetail} from "./ITokenDetail";

export type TokenType = "erc20" | "erc721" | "eas";

export type BlockChain = "eth" | "offchain";

export interface ITokenCollection {
	id: string,
	blockChain: BlockChain;
	chainId: number;
	tokenType: TokenType;
	collectionId: string;
	name?: string;
	description?: string;
	symbol?: string;
	decimals?: number;
	balance?: number;
	image?: string;
	tokenDetails?: ITokenDetail[];
	data?: any;
}

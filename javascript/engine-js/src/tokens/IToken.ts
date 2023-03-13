/**
 * This is the top level token interface. In ethereum it represents a contract/collection.
 * NFTs have child token details whilst FTs only have a balance
 */
import {INFTTokenDetail} from "./INFTTokenDetail";

export type TokenType = "erc20" | "erc721";

export type BlockChain = "eth";

export interface IToken {
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
	nftDetails?: INFTTokenDetail[];
	data?: any;
}

import {Event} from "ethers";
import {ITransactionListener} from "../TokenScript";

/**
 * The interface for integrating wallet connecton from the user-agent
 */
export interface IWalletAdapter {
	getCurrentWalletAddress(): Promise<string>;
	signPersonalMessage(message: string): Promise<string>;
	call(
		chain: number,
		contractAddr: string,
		method: string,
		args: any[],
		outputTypes: string[],
		errorAbi?: any[]
	): Promise<any>;
	getEvents(
		chain: number,
		contractAddr: string,
		type: string,
		inputs: any[]
	): Promise<Event[]>;
	sendTransaction(
		chain: number,
		contractAddr: string,
		method: string,
		args: any[],
		outputTypes: string[],
		value?: BigInt,
		waitForConfirmation?: boolean,
		listener?: ITransactionListener,
		errorAbi?: any[]
	): Promise<any>;
	getChain(): Promise<number>;
	getRpcUrl(chainId: number): string;
}

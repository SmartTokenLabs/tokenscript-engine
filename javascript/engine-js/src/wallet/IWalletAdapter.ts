import {EventLog, Log} from "ethers";
import {ITransactionListener} from "../TokenScript";
import {IChainConfig} from "./EthersAdapter";
import {IPaymasterInfo} from "../tokenScript/Transaction";

export interface RpcRequest {
	jsonrpc: "2.0";
	id: number;
	method: string;
	params: any[];
}

export interface RpcResponse {
	jsonrpc: "2.0";
	id: number;
	result?: any;
	error?: any;
}

/**
 * The interface for integrating wallet connecton from the user-agent
 */
export interface IWalletAdapter {
	readonly chainConfig: {[key: number]: IChainConfig};
	getCurrentWalletAddress(): Promise<string>;
	signPersonalMessage(message: string): Promise<string>;
	call(
		chain: number,
		contractAddr: string,
		method: string,
		args: any[],
		outputTypes: any[]|string[],
		errorAbi?: any[]
	): Promise<any>;
	getEvents(
		chain: number,
		contractAddr: string,
		type: string,
		inputs: any[]
	): Promise<Array<EventLog>>;
	sendTransaction(
		chain: number,
		contractAddr: string,
		method: string,
		args: any[],
		value?: BigInt,
		waitForConfirmation?: boolean,
		listener?: ITransactionListener,
		errorAbi?: any[],
		paymaster?: IPaymasterInfo
	): Promise<any>;
	getChain(): Promise<number>;
	getRpcUrls(chainId: number): string[];
	rpcProxy(request: RpcRequest): Promise<any>;
}

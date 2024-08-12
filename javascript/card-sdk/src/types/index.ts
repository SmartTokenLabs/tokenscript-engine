import {ITokenContextData} from "./tokenData";
import {IEngineAdapter} from "../messaging/IEngineAdapter";
import {IInstanceData} from "../index";
import {AbstractProvider, Contract} from "ethers";
export {ITokenContextData};

export type SignPersonalFunc = (msgParams: {data: string}, callback?: (error: any, data: string) => void) => void|Promise<string>;

export interface ITransactionStatus {
	status: 'started'|'aborted'|'submitted'|'confirmed'|'completed',
	txNumber?: string,
	txLink?: string,
	txRecord?: any
}

export interface ITransactionListener {
	(data: ITransactionStatus): void|Promise<void>
}

export interface TXOptions {
	txName?: string
}

export interface ITokenData {
	currentInstance: ITokenContextData
}

export type EventHandler = (data: any) => Promise<void>|void;

export type EventName = "TRANSACTION_EVENT";

export interface TokenScriptEvents {
	TRANSACTION_EVENT: ITransactionStatus
}

export interface ITokenScriptSDK {
	engineAdapter: IEngineAdapter;
	instanceData: IInstanceData;
	tokens: {
		data: ITokenData,
		dataChanged: (prevTokens: any, newTokens: ITokenData, id: string) => void
	}
	action: {
		setProps: (data: any) => void,
		showLoader: () => void,
		hideLoader: () => void,
		setActionButton: (options: { show?: boolean, disable?: boolean, text?: string }) => void,
		executeTransaction: (txName?: string|TXOptions, listener?: ITransactionListener) => Promise<any|false>,
		showTransactionToast: (status: "submitted"|"confirmed", chain: number, txHash: string) => void,
		showMessageToast: (type: 'success'|'info'|'warning'|'error', title: string, description: string) => void,
		closeCard: () => void,
		openCard: (name: string, originId?: string, tokenId?: string) => void
	}
	personal: {
		sign: SignPersonalFunc
	}
	eth: {
		getRpcUrls: (chain: number) => string[]
		getRpcProvider: (chain: number) => AbstractProvider
		getContractInfo: (name: string, chain?: number) => {chain: number, address: string, abi: any}
		getContractInstance: (name: string, chain?: number) => Contract
	}
	env: {[key: string]: string}
	emitEvent: <
			T extends keyof TokenScriptEvents, // <- T points to a key
			R extends (TokenScriptEvents)[T] // <- R points to the type of that key
		>(eventType: T, params?: R) => void
	on: <
			T extends keyof TokenScriptEvents,
			R extends (data: ((TokenScriptEvents)[T])) => Promise<void>|void
		>(eventType: T, callback: R, id: string) => void
	off: <T extends keyof TokenScriptEvents, >(eventType: T, id?: string) => void
}
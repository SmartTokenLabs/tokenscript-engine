import {ITokenContextData} from "./tokenData";
import {IEngineAdapter} from "../messaging/IEngineAdapter";
import {IInstanceData} from "../index";
import {AbstractProvider} from "ethers";
export {ITokenContextData};

export type SignPersonalFunc = (msgParams: {data: string}, callback: (error, data) => void) => void;

export interface ITokenData {
	currentInstance: ITokenContextData
}

export interface IWeb3LegacySDK {
	engineAdapter: IEngineAdapter;
	instanceData: IInstanceData;

	tokens: {
		data: ITokenData,
		dataChanged: (prevTokens: any, newTokens: ITokenData, id: string) => void
	}
	executeCallback: (id: number, error: string, value: any) => void
	action: {
		setProps: (data: any) => void,
		showLoader: () => void,
		hideLoader: () => void,
		setActionButton: (options: { show?: boolean, disable?: boolean, text?: string }) => void,
		executeTransaction: () => void,
		showTransactionToast: (status: "submitted"|"confirmed", chain: number, txHash: string) => void,
		showMessageToast: (type: 'success'|'info'|'warning'|'error', title: string, description: string) => void
	}
	personal: {
		sign: SignPersonalFunc
	}
}

export interface ITokenScriptSDK extends IWeb3LegacySDK {
	eth: {
		getRpcUrls: (chain: number) => string[]
		getRpcProvider: (chain: number) => AbstractProvider
	}
}
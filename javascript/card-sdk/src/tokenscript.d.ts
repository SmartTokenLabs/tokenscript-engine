import {Eip1193Provider} from "ethers";

type IWeb3LegacySDK = import('./types').IWeb3LegacySDK;
type ITokenScriptSDK = import('./types').ITokenScriptSDK;
type ethers = typeof import('ethers').ethers;

export declare global {
	interface Window {
		ethers: ethers
		web3: IWeb3LegacySDK,
		tokenscript: ITokenScriptSDK,
		executeCallback: (id: number, error: string, value: any) => void
		onConfirm?: () => void|Promise<void>
		ethereum: Eip1193Provider
	}
	var ethers: ethers
	var web3: IWeb3LegacySDK;
	var tokenscript: ITokenScriptSDK
	var chainID: string
	var rpcURL: string
	var walletAddress: string
}
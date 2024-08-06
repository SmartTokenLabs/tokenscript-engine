import {Eip1193Provider} from "ethers";

type IWeb3LegacySDK = import('./types').IWeb3LegacySDK;
type ITokenScriptSDK = import('./types').ITokenScriptSDK;
type Ethers = import('ethers').ethers;

export declare global {
	interface Window {
		ethers: Ethers
		web3: IWeb3LegacySDK,
		tokenscript: ITokenScriptSDK,
		onConfirm?: () => void|Promise<void>
		ethereum: Eip1193Provider
	}
	var ethers: Ethers
	var web3: IWeb3LegacySDK;
	var tokenscript: ITokenScriptSDK
	var chainID: string
	var rpcURL: string
	var walletAddress: string
}
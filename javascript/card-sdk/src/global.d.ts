import {Eip1193Provider} from "ethers";

type IWeb3LegacySDK = import('./index').IWeb3LegacySDK;
type ITokenScriptSDK = import('./index').ITokenScriptSDK;
type ethers = typeof import('ethers').ethers;

export declare global {
	interface Window {
		ethers: ethers
		web3: IWeb3LegacySDK,
		tokenscript: ITokenScriptSDK,
		executeCallback: (id: number, error: string, value: any) => void
		ethereum: Eip1193Provider
	}
	//var ethers: ethers
	var web3: IWeb3LegacySDK;
	var tokenscript: ITokenScriptSDK
}
type IWeb3LegacySDK = import('./index').IWeb3LegacySDK;
type ITokenScriptSDK = import('./index').ITokenScriptSDK;
//type ethers = import('ethers').ethers;

export declare global {
	interface Window {
		//ethers: ethers
		web3: IWeb3LegacySDK,
		tokenscript: ITokenScriptSDK,
	}
	//var ethers: ethers
	var web3: IWeb3LegacySDK;
	var tokenscript: ITokenScriptSDK
}
import {ITokenScriptSDK, IWeb3LegacySDK} from "./index";

declare global {
    interface Window {
        web3: IWeb3LegacySDK,
        tokenscript: ITokenScriptSDK,
    }
}
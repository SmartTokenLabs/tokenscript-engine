
import {ethers} from "ethers";
import {IFrameEthereumProvider} from "./ethereum/IframeEthereumProvider";

import {ITokenContextData, ITokenData, ITokenScriptSDK, IWeb3LegacySDK} from "./types";

class Web3LegacySDK implements IWeb3LegacySDK {

    private web3CallBacks = {}

    setInstanceData(_currentTokenInstance?: ITokenContextData) {
        this.tokens.data.currentInstance = _currentTokenInstance;
    }

    public executeCallback (id: number, error: string, value: any) {
        console.debug('Execute callback: ' + id + ' ' + value)
        this.web3CallBacks[id](error, value)
        delete this.web3CallBacks[id]
    }

    public readonly personal = {
        sign: (msgParams: {data: string, id: number}, cb: (error, data) => void) => {
            const { data } = msgParams;
            const { id = 8888 } = msgParams;
            this.web3CallBacks[id] = cb;
            // @ts-ignore
            alpha.signPersonalMessage(id, data);
        }
    };

    public readonly tokens = {
        data: {
            currentInstance: <ITokenContextData>{},
        },
        dataChanged: (prevTokens: any, newTokens: ITokenData, id: string) => {
            console.log('web3.tokens.data changed.');
        }
    }

    public readonly action = {
        setProps: function (msgParams) {
            // @ts-ignore
            alpha.setValues(JSON.stringify(msgParams));
        }
    }
}

class TokenScriptSDK extends Web3LegacySDK implements ITokenScriptSDK {

}

window.ethers = ethers;
window.tokenscript = new TokenScriptSDK();
window.web3 = window.tokenscript;
window.ethereum = new IFrameEthereumProvider();
window.executeCallback = (id: number, error: string, value: any) => window.web3.executeCallback(id, error, value);


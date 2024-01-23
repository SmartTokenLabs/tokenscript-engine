
import {ethers} from "ethers";
import {IFrameEthereumProvider} from "./IframeEthereumProvider";

type SignPersonalFunc = (msgParams: {data: string}, callback: (error, data) => void) => void;

export interface IWeb3LegacySDK {
    tokens: {
        data: {
            currentInstance: any
        },
        dataChanged: (prevTokens: any, newTokens: any, id: string) => void
    }
    executeCallback: (id: number, error: string, value: any) => void
    action: {
        setProps: (data: any) => void,
    }
    personal: {
        sign: SignPersonalFunc
    }
}

export interface ITokenScriptSDK extends IWeb3LegacySDK {

}

class Web3LegacySDK implements IWeb3LegacySDK {

    private web3CallBacks = {}

    setInstanceData(_currentTokenInstance?: any) {
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
            currentInstance: {},
        },
        dataChanged: (prevTokens: any, newTokens: any, id: string) => {
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


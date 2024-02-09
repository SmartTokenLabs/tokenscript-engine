import {ethers} from "ethers";
import {IFrameEthereumProvider} from "./ethereum/IframeEthereumProvider";

import {ITokenContextData, ITokenData, ITokenScriptSDK, IWeb3LegacySDK} from "./types";
import {IEngineAdapter, RequestFromView} from "./messaging/IEngineAdapter";
import {PostMessageAdapter} from "./messaging/PostMessageAdapter";

export interface IInstanceData {
    currentTokenInstance: ITokenContextData,
    engineOrigin: string
}

class Web3LegacySDK implements IWeb3LegacySDK {

    private web3CallBacks = {};

    private engineAdapter: IEngineAdapter;

    setInstanceData(instanceData: IInstanceData) {
        this.tokens.data.currentInstance = instanceData.currentTokenInstance;
        this.engineAdapter = new PostMessageAdapter(this, instanceData.engineOrigin);
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

            this.engineAdapter.request(RequestFromView.SIGN_PERSONAL_MESSAGE, msgParams);

            // @ts-ignore
            //alpha.signPersonalMessage(id, data);
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
            this.engineAdapter.request(RequestFromView.PUT_USER_INPUT, msgParams);
            // @ts-ignore
            // alpha.setValues(JSON.stringify(msgParams));
        }.bind(this)
    }
}

class TokenScriptSDK extends Web3LegacySDK implements ITokenScriptSDK {

}

window.ethers = ethers;
window.tokenscript = new TokenScriptSDK();
window.web3 = window.tokenscript;
window.ethereum = new IFrameEthereumProvider();
window.executeCallback = (id: number, error: string, value: any) => window.web3.executeCallback(id, error, value);


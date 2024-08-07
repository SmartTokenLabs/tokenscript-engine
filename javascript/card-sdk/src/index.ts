import {BrowserProvider, Contract, ethers, Network} from "ethers";
import {IFrameEthereumProvider} from "./ethereum/IframeEthereumProvider";
import {ITokenContextData, ITokenData, ITokenScriptSDK, IWeb3LegacySDK} from "./types";
import {IEngineAdapter, RequestFromView} from "./messaging/IEngineAdapter";
import {PostMessageAdapter} from "./messaging/PostMessageAdapter";
import {LocalStorageAdapter} from "./storage/localStorageAdapter";

export interface IChainConfig {
    rpc: string|string[],
    explorer: string
}

export interface IInstanceData {
    currentTokenInstance: ITokenContextData,
    engineOrigin: string,
    localStorageData: {[key: string]: string},
    chainConfig: {[key: string]: IChainConfig}
    env: {[key: string]: string}
    contractData: {[name: string]: {
        abi: any[],
        addresses: {[chain: number]: string}
    }}
}

class Web3LegacySDK implements IWeb3LegacySDK {

    public readonly engineAdapter: IEngineAdapter;

    private _instanceData: IInstanceData;

    private web3CallBacks = {};

    public get instanceData () {
        return this._instanceData;
    }

    constructor() {
        this.engineAdapter = new PostMessageAdapter(this);
    }

    public setInstanceData(instanceData: IInstanceData) {
        this._instanceData = instanceData
        this.tokens.data.currentInstance = this.instanceData.currentTokenInstance;
    }

    // TODO: Move to postMessage adapter
    public executeCallback (id: number, error: string, value: any) {
        console.debug('Execute callback: ' + id + ' ' + value)
        this.web3CallBacks[id](error, value)
        delete this.web3CallBacks[id]
    }

    public readonly personal = {
        sign: (msgParams: {data: string, id?: number}, cb: (error, data) => void) => {

            if (!msgParams.id)
                msgParams.id = Date.now();

            this.web3CallBacks[msgParams.id] = cb;

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
        }.bind(this),
        showLoader: () => {
            this.engineAdapter.request(RequestFromView.SET_LOADER, { show: true });
        },
        hideLoader:() => {
            this.engineAdapter.request(RequestFromView.SET_LOADER, { show: false });
        },
        setActionButton: (options: { show?: boolean, disable?: boolean, text?: string }) => {
            this.engineAdapter.request(RequestFromView.SET_BUTTON, options);
        },
        executeTransaction:(txName?: string) => {
            this.engineAdapter.request(RequestFromView.EXEC_TRANSACTION, { txName });
        },
        showTransactionToast: (status: "submitted"|"confirmed", chain: number, txHash: string) => {
            this.engineAdapter.request(RequestFromView.SHOW_TX_TOAST, { status, chain, txHash });
        },
        showMessageToast: (type: 'success'|'info'|'warning'|'error', title: string, description: string) => {
            this.engineAdapter.request(RequestFromView.SHOW_TOAST, { type, title, description });
        },
        closeCard: () => {
            this.engineAdapter.request(RequestFromView.CLOSE, undefined);
        },
        openCard: (name: string, originId?: string, tokenId?: string) => {
            this.engineAdapter.request(RequestFromView.OPEN_CARD, {name, originId, tokenId});
        }
    }
}

class TokenScriptSDK extends Web3LegacySDK implements ITokenScriptSDK {

    private readonly localStorageAdapter: LocalStorageAdapter;

    constructor() {
        super();
        this.localStorageAdapter = new LocalStorageAdapter(this);
    }

    public get env() {
        return this.instanceData.env;
    };

    public readonly eth = {
        getRpcProvider: (chain: number) => {

            const rpcUrls = this.eth.getRpcUrls(chain);

            if (rpcUrls.length > 1){
                const providers = [];
                for (const url of rpcUrls){
                    providers.push(new ethers.JsonRpcProvider(url, chain, { staticNetwork: new Network(chain.toString(), chain) }));
                }
                return new ethers.FallbackProvider(providers, chain, {
                    quorum: 2
                });
            } else {
                return new ethers.JsonRpcProvider(rpcUrls[0], chain, { staticNetwork: new Network(chain.toString(), chain) });
            }
        },
        getRpcUrls: (chainId: number) => {

            if (!this.instanceData.chainConfig[chainId])
                throw new Error("RPC URL is not configured for ethereum chain: " + chainId);

            const rpc = this.instanceData.chainConfig[chainId].rpc;

            return typeof rpc === "string" ? [rpc]: rpc;
        },
        getContractInfo: (name: string, chain?: number) => {

            const contractData = this.instanceData.contractData[name];
            if (!contractData)
                throw new Error(`Named contract '${name} does not exist`);

            if (!chain)
                chain = Number(Object.keys(contractData.addresses)[0]);

            const address = contractData.addresses[chain];
            if (!address)
                throw new Error(`Named contract '${name} does not have an address for chain ${chain}`);

            return {
                chain,
                address,
                abi: contractData.abi
            };
        },
        getContractInstance: (name: string, chain?: number, writable = false) => {
            const addressInfo = this.eth.getContractInfo(name, chain);
            return new Contract(
                addressInfo.address,
                addressInfo.abi,
                writable ? new BrowserProvider(window.ethereum, Network.from(addressInfo.chain)) : this.eth.getRpcProvider(addressInfo.chain)
            );
        },
    }
}

window.ethers = ethers;
window.tokenscript = new TokenScriptSDK();
window.web3 = window.tokenscript;
window.ethereum = new IFrameEthereumProvider();
window.executeCallback = (id: number, error: string, value: any) => window.web3.executeCallback(id, error, value);


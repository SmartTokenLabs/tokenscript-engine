import {BrowserProvider, Contract, ethers, Network} from "ethers";
import {IFrameEthereumProvider} from "./ethereum/IframeEthereumProvider";
import {
    EventHandler,
    ITokenContextData,
    ITokenData,
    ITokenScriptSDK,
    ITransactionListener,
    ITransactionStatus,
    TokenScriptEvents,
    TXOptions
} from "./types";
import {IEngineAdapter, RequestFromView} from "./messaging/IEngineAdapter";
import {PostMessageAdapter} from "./messaging/PostMessageAdapter";
import {LocalStorageAdapter} from "./storage/localStorageAdapter";
import {WaterfallFallbackProvider} from "./ethereum/WaterfallFallbackProvider";

export interface IChainConfig {
    rpc: string|string[],
    explorer: string
}

export interface IInstanceData {
    currentTokenInstance?: ITokenContextData,
    engineOrigin: string,
    localStorageData: {[key: string]: string},
    chainConfig: {[key: string]: IChainConfig}
    env: {[key: string]: string}
    contractData: {[name: string]: {
        abi: any[],
        addresses: {[chain: number]: string}
    }}
}

class TokenScriptSDK  implements ITokenScriptSDK {

    public readonly engineAdapter: IEngineAdapter;

    private readonly localStorageAdapter: LocalStorageAdapter;

    private eventHandlers: {[eventName: string]: {[handlerId: string]: EventHandler}} = {};

    private _instanceData: IInstanceData;

    public get instanceData () {
        if (!this._instanceData)
            return {
                engineOrigin: "",
                localStorageData: {},
                chainConfig: {},
                env: {},
                contractData: {}
            }

        return this._instanceData;
    }

    constructor() {
        this.engineAdapter = new PostMessageAdapter(this);
        this.localStorageAdapter = new LocalStorageAdapter(this);
    }

    public setInstanceData(instanceData: IInstanceData) {
        this._instanceData = instanceData
        this.tokens.data.currentInstance = this.instanceData.currentTokenInstance;
    }

    public readonly personal = {
        sign: async (msgParams: {data: string}, cb?: (error: any, data: string) => void) => {

            try {
                const res = await this.engineAdapter.request<{result: string}>(RequestFromView.SIGN_PERSONAL_MESSAGE, msgParams, true) as {result: string};

                if (!cb)
                    return res.result;
                cb(null, res.result);
            } catch (e) {
                if (!cb)
                    throw e;
                cb(e, null);
            }
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
        executeTransaction: async (optionsOrTxName?: string|TXOptions, listener?: ITransactionListener) => {
            if (typeof optionsOrTxName === "string")
                optionsOrTxName = {txName: optionsOrTxName};

            const result = await this.engineAdapter.request<ITransactionStatus>(RequestFromView.EXEC_TRANSACTION, optionsOrTxName, (event, data: ITransactionStatus) => {
                if (listener)
                    listener(data);
                return data.status === "completed" || data.status === "aborted";
            }) as ITransactionStatus;

            if (result.status === "aborted")
                return false;

            return result;
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

    public get env() {
        return this.instanceData.env;
    };

    public readonly eth = {
        getRpcProvider: (chain: number) => {

            const rpcUrls = this.eth.getRpcUrls(chain);

            if (rpcUrls.length > 1){
                return new WaterfallFallbackProvider(
                    rpcUrls.map((url) => {
                        return new ethers.JsonRpcProvider(url, chain, { staticNetwork: new Network(chain.toString(), chain) })
                    })
                );
                /*this.rpcProviders[chain] = new ethers.FallbackProvider(
                    rpcUrls.map((url, index) => {
                        return {
                            provider: new ethers.JsonRpcProvider(url, chain, { staticNetwork: new Network(chain.toString(), chain) }),
                            stallTimeout: 1500,
                            priority: index + 1,
                        }
                    }),
                    chain,
                    {
                        quorum: 1
                    }
                );*/
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

    /**
     * Emit a TokenScript engine event to the user-agent
     * @param eventType
     * @param params
     * @private
     */
    public emitEvent<
        T extends keyof TokenScriptEvents, // <- T points to a key
        R extends (TokenScriptEvents)[T] // <- R points to the type of that key
    >(eventType: T, params?: R) {
        if (this.eventHandlers[eventType])
            for (const handler of Object.values(this.eventHandlers[eventType])){
                handler(params);
            }
    }

    /**
     * Register an event listener to receive TokenScript engine events
     * @param eventType
     * @param callback
     * @param id - The ID of the event handler, used to avoid duplicate handlers & remove handlers
     */
    public on<
        T extends keyof TokenScriptEvents,
        R extends (data: ((TokenScriptEvents)[T])) => Promise<void>|void
    >(eventType: T, callback: R, id: string = "default"){

        if (!this.eventHandlers[eventType])
            this.eventHandlers[eventType] = {};

        this.eventHandlers[eventType][id] = callback;
    }

    /**
     * Remove an event listener
     * @param eventType
     * @param id The ID of the handler to remove - if not specified then all handlers are removed.
     */
    public off<
        T extends keyof TokenScriptEvents,
    >(eventType: T, id?: string){

        if (!id) {
            delete this.eventHandlers[eventType];
            return;
        }

        delete this.eventHandlers[eventType][id];
    }
}

window.ethers = ethers;
window.tokenscript = new TokenScriptSDK();
window.web3 = window.tokenscript;
window.ethereum = new IFrameEthereumProvider();


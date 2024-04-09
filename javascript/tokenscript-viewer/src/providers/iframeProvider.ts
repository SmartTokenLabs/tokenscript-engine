import { ethers } from "ethers";

const DEFAULT_TARGET_ORIGIN = "*";
const DEFAULT_TYPE = "ethereum";

// The interface for the source of the events, typically the window.
export interface MinimalEventSourceInterface {
  addEventListener(
    eventType: "message",
    handler: (message: MessageEvent) => void
  ): void;
}

/**
 * Options for constructing the iframe ethereum provider.
 */
export interface IFrameEthereumProviderOptions {
  // The origin to communicate with. Default '*'
  targetOrigin?: string;

  // The transaction provider
  provider?: any | undefined;

  // The event source. By default we use the window.
  eventSource?: MinimalEventSourceInterface;

  iframeRef: HTMLIFrameElement;

  // The provider type, e.g. "wagmi" or "ethereum"
  type: string;
}

// The interface for the source of the events, typically the window.
export interface MinimalEventSourceInterface {
  addEventListener(
    eventType: "message",
    handler: (message: MessageEvent) => void
  ): void;
}

/**
 * This is the primary artifact of this library.
 */
export class IFrameProvider {
  private readonly targetOrigin: string;
  private readonly provider: any;
  private readonly eventSource: MinimalEventSourceInterface;
  private readonly iframeRef: HTMLIFrameElement | undefined;
  private readonly type: string;

  public constructor(options: IFrameEthereumProviderOptions) {
    this.targetOrigin = options.targetOrigin ?? DEFAULT_TARGET_ORIGIN;
    this.provider = options.provider;
    this.eventSource = options.eventSource ?? window;
    this.iframeRef = options.iframeRef;

    this.type = options.type?.toLowerCase() ?? DEFAULT_TYPE;
    // Listen for messages from the event source.
    this.handleMessage();
  }

  private handleMessage = async () => {
    this.eventSource.addEventListener(
      "message",
      async (message: MessageEvent) => {
        if (!this.provider) {
          return;
        }

        if (!message.data.method) {
          return;
        }

        if (
          this.targetOrigin !== DEFAULT_TARGET_ORIGIN &&
          message.origin !== this.targetOrigin
        )
          return;

        try {
          switch (message.data.method) {
            case "eth_getBaseFeePerGas": {
              if (this.type === DEFAULT_TYPE) {
                const pending = await this.provider.getBlock("pending");
                this.sendResponse(
                  message.data,
                  pending.baseFeePerGas,
                  {}
                );
              }
              break;
            }
            case "eth_encodeData": {
              if (this.type === DEFAULT_TYPE) {
                const params = message.data.params;
                const signer = await this.provider.getSigner();
                const dvpContract = new ethers.Contract(
                  params.contract,
                  params.abi,
                  signer
                );
                const encodeData = dvpContract.interface.encodeFunctionData(
                  params.function,
                  params.data
                );
                this.sendResponse(message.data, encodeData, {});
              }
              break;
            }
	    	case 'eth_decodeEventLog': {
           	 if (this.type === DEFAULT_TYPE) {
           	   const params = message.data.params;
           	   const signer = await this.provider.getSigner();
           	   const dvpContract = new ethers.Contract(params.contract, params.abi, signer);
           	   const decodeData = dvpContract.interface.decodeEventLog(params.function, params.data[0], params.data[1]);
            	  this.sendResponse(message.data, decodeData.toString(), {});
           	 	}
           	    break;
         	 }
            case "eth_accounts":
            case "eth_requestAccounts": {
              const accounts = await this.requestAccounts(message, this.type);
              this.sendResponse(message.data, accounts, {});
              break;
            }
            case "eth_getCode":
            case "eth_blockNumber":
            case "eth_chainId":
            case "net_version":
            case "eth_estimateGas":
            case "eth_sendTransaction":
            case "eth_getTransactionByHash":
            case "eth_getTransactionReceipt":
            case "eth_getTransactionCount":
            case "personal_sign":
            case "eth_signTypedData": //for v1
            case "eth_signTypedData_v4":
	    	case "eth_call":
            case "wallet_switchEthereumChain": {
              const result = await this.requestMethod(message, this.type);
              this.sendResponse(message.data, result, {});
              break;
            }
            default: {
              this.sendResponse(message.data, null, {
                code: -1,
                message:
                  "RPC Method " + message.data.method + " is not implemented",
              });
            }
          }
        } catch (e:any) {
          console.log(e);
          this.sendResponse(message.data, null, {
            code: e.data?.code ?? e.code,
            message: e.message + (e.data?.message ? " " + e.data?.message : ""),
          });
        }
      }
    );
  };

  private async requestMethod(event: MessageEvent, type: string) {
    if (type === "wagmi") {
      return await this.provider.request({
        method: event.data.method,
        params: event.data.params,
      });
    } else {
      return await this.provider.send(event.data.method, event.data.params);
    }
  }

  private async requestAccounts(event: MessageEvent, type: string) {
    if (type === "wagmi") {
      return await this.provider.request({
        method: event.data.method,
      });
    } else {
      return await this.provider.listAccounts();
    }
  }

  public sendResponse = (
    messageData: MessageEvent["data"],
    response: any,
    error?: any
  ) => {
    const data = messageData;

    if (response) {
      data.result = response;
    } else {
      data.error = error;
    }

    (this.iframeRef as any).contentWindow.postMessage(data, this.targetOrigin);
  };
}

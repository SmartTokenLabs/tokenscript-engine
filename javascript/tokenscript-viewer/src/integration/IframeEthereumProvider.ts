import {ethers} from "ethers";

// By default post to any origin
const DEFAULT_TARGET_ORIGIN = '*';
// By default timeout is 60 seconds
const DEFAULT_TIMEOUT_MILLISECONDS = 120000;

const JSON_RPC_VERSION = '2.0';

// The interface for the source of the events, typically the window.
export interface MinimalEventSourceInterface {
	addEventListener(
		eventType: 'message',
		handler: (message: MessageEvent) => void
	): void;
}

// The interface for the target of our events, typically the parent window.
export interface MinimalEventTargetInterface {
	postMessage(message: any, targetOrigin?: string): void;
}

/**
 * Options for constructing the iframe ethereum provider.
 */
interface IFrameEthereumProviderOptions {
	// The origin to communicate with. Default '*'
	targetOrigin?: string;
	// How long to time out waiting for responses. Default 60 seconds.
	timeoutMilliseconds?: number;

	// The event source. By default we use the window. This can be mocked for tests, or it can wrap
	// a different interface, e.g. workers.
	eventSource?: MinimalEventSourceInterface;

	// The event target. By default we use the window parent. This can be mocked for tests, or it can wrap
	// a different interface, e.g. workers.
	eventTarget?: MinimalEventTargetInterface;
}

/**
 * This is what we store in the state to keep track of pending promises.
 */
interface PromiseCompleter<TResult, TErrorData> {
	// A response was received (either error or result response).
	resolve(
		result:
			| JsonRpcSucessfulResponseMessage<TResult>
			| JsonRpcErrorResponseMessage<TErrorData>
	): void;

	// An error with executing the request was encountered.
	reject(error: Error): void;
}

type MessageId = number | string | null;

interface JsonRpcRequestMessage<TParams = any> {
	jsonrpc: '2.0';
	// Optional in the request.
	id?: MessageId;
	method: string;
	params?: TParams;
}

interface BaseJsonRpcResponseMessage {
	// Required but null if not identified in request
	id: MessageId;
	jsonrpc: '2.0';
}

interface JsonRpcSucessfulResponseMessage<TResult = any>
	extends BaseJsonRpcResponseMessage {
	result: TResult;
}

interface JsonRpcError<TData = any> {
	code: number;
	message: string;
	data?: TData;
}

interface JsonRpcErrorResponseMessage<TErrorData = any>
	extends BaseJsonRpcResponseMessage {
	error: JsonRpcError<TErrorData>;
}

type ReceivedMessageType =
	| JsonRpcRequestMessage
	| JsonRpcErrorResponseMessage
	| JsonRpcSucessfulResponseMessage;

/**
 * We return a random number between the 0 and the maximum safe integer so that we always generate a unique identifier,
 * across all communication channels.
 */
function getUniqueId(): number {
	return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

export type IFrameEthereumProviderEventTypes =
	| 'connect'
	| 'close'
	| 'notification'
	| 'chainChanged'
	| 'networkChanged'
	| 'accountsChanged';

/**
 * Export the type information about the different events that are emitted.
 */
export interface IFrameEthereumProvider {
	on(event: 'connect', handler: () => void): this;

	on(event: 'close', handler: (code: number, reason: string) => void): this;

	on(event: 'notification', handler: (result: any) => void): this;

	on(event: 'chainChanged', handler: (chainId: string) => void): this;

	on(event: 'networkChanged', handler: (networkId: string) => void): this;

	on(event: 'accountsChanged', handler: (accounts: string[]) => void): this;
}

/**
 * Represents an error in an RPC returned from the event source. Always contains a code and a reason. The message
 * is constructed from both.
 */
export class RpcError extends Error {
	public readonly isRpcError: true = true;

	public readonly code: number;
	public readonly reason: string;

	constructor(code: number, reason: string) {
		super(`${code}: ${reason}`);

		this.code = code;
		this.reason = reason;
	}
}

/**
 * This is the primary artifact of this library.
 */
export class IFrameEthereumProvider implements ethers.providers.ExternalProvider {

	_isSigner = true;

	/**
	 * Differentiate this provider from other providers by providing an isIFrame property that always returns true.
	 */
	public get isIFrame(): true {
		return true;
	}

	/**
	 * Always return this for currentProvider.
	 */
	public get currentProvider(): IFrameEthereumProvider {
		return this;
	}

	private readonly targetOrigin: string;
	private readonly timeoutMilliseconds: number;
	private readonly eventSource: MinimalEventSourceInterface;
	private readonly eventTarget: MinimalEventTargetInterface;
	private readonly completers: {
		[id: string]: PromiseCompleter<any, any>;
	} = {};

	public constructor({
						   targetOrigin = DEFAULT_TARGET_ORIGIN,
						   timeoutMilliseconds = DEFAULT_TIMEOUT_MILLISECONDS,
						   eventSource = window,
						   eventTarget = window.parent,
					   }: IFrameEthereumProviderOptions = {}) {
		// Call super for `this` to be defined
		//super();

		this.targetOrigin = targetOrigin;
		this.timeoutMilliseconds = timeoutMilliseconds;
		this.eventSource = eventSource;
		this.eventTarget = eventTarget;

		// Listen for messages from the event source.
		this.eventSource.addEventListener('message', this.handleEventSourceMessage);
	}

	/**
	 * Helper method that handles transport and request wrapping
	 * @param method method to execute
	 * @param params params to pass the method
	 */
	private async execute<TParams, TResult, TErrorData>(
		method: string,
		params?: TParams
	): Promise<
		| JsonRpcSucessfulResponseMessage<TResult>
		| JsonRpcErrorResponseMessage<TErrorData>
	> {
		const id = getUniqueId();
		const payload: JsonRpcRequestMessage = {
			jsonrpc: JSON_RPC_VERSION,
			id,
			method,
			...(typeof params === 'undefined' ? null : { params }),
		};

		const promise = new Promise<
			| JsonRpcSucessfulResponseMessage<TResult>
			| JsonRpcErrorResponseMessage<TErrorData>
		>((resolve, reject) => (this.completers[id] = { resolve, reject }));

		// Send the JSON RPC to the event source.
		this.eventTarget.postMessage(payload, this.targetOrigin);

		console.log("[IFRAME_RPC] request: ", payload);

		// Delete the completer within the timeout and reject the promise.
		setTimeout(() => {
			if (this.completers[id]) {
				this.completers[id].reject(
					new Error(
						`RPC ID "${id}" timed out after ${this.timeoutMilliseconds} milliseconds`
					)
				);
				delete this.completers[id];
			}
		}, this.timeoutMilliseconds);

		return promise;
	}

	/**
	 * Send the JSON RPC and return the result.
	 * @param request
	 * @param callback
	 */
	public send(request: {method: string, params?: Array<any>}, callback: (error: any, response: any) => void) {

		this.execute(request.method, request.params).then(response => {
			if ('error' in response) {
				callback(response.error.code + ": " + response.error.message, null);
			} else {
				callback(null, response.result);
			}
		});
	}

	/**
	 * Backwards compatibility method for web3.
	 * @param request payload to send to the provider
	 * @param callback callback to be called when the provider resolves
	 */
	public async sendAsync(
		request: {method: string, params?: Array<any>}, callback: (error: any, response: any) => void
	) {
		try {
			const result = await this.execute(request.method, request.params);
			callback(null, result);
		} catch (error) {
			callback(error.code + ": " + error.message, null);
		}
	}

	/**
	 * Handle a message on the event source.
	 * @param event message event that will be processed by the provider
	 */
	private handleEventSourceMessage = (event: MessageEvent) => {

		if (this.targetOrigin !== "*" && event.origin.indexOf(this.targetOrigin) !== 0)
			return;

		const data = event.data;

		// No data to parse, skip.
		if (!data) {
			return;
		}

		const message = data as ReceivedMessageType;

		// Always expect jsonrpc to be set to '2.0'
		if (message.jsonrpc !== JSON_RPC_VERSION) {
			return;
		}

		console.log("[IFRAME_RPC] response received: ", data);

		// If the message has an ID, it is possibly a response message
		if (typeof message.id !== 'undefined' && message.id !== null) {
			const completer = this.completers['' + message.id];

			// True if we haven't timed out and this is a response to a message we sent.
			if (completer) {
				// Handle pending promise
				if ('error' in message || 'result' in message) {
					completer.resolve(message);
				} else {
					completer.reject(
						new Error('Response from provider did not have error or result key')
					);
				}

				delete this.completers[message.id];
			}
		}

		// If the method is a request from the parent window, it is likely a subscription.
		/*if ('method' in message) {
			switch (message.method) {
				case 'notification':
					this.emitNotification(message.params);
					break;

				case 'connect':
					this.emitConnect();
					break;

				case 'close':
					this.emitClose(message.params[0], message.params[1]);
					break;

				case 'chainChanged':
					this.emitChainChanged(message.params[0]);
					break;

				case 'networkChanged':
					this.emitNetworkChanged(message.params[0]);
					break;

				case 'accountsChanged':
					this.emitAccountsChanged(message.params[0]);
					break;
			}
		}*/
	};

	/*private emitNotification(result: any) {
		this.emit('notification', result);
	}

	private emitConnect() {
		this.emit('connect');
	}

	private emitClose(code: number, reason: string) {
		this.emit('close', code, reason);
	}

	private emitChainChanged(chainId: string) {
		this.emit('chainChanged', chainId);
	}

	private emitNetworkChanged(networkId: string) {
		this.emit('networkChanged', networkId);
	}

	private emitAccountsChanged(accounts: string[]) {
		this.enabled = Promise.resolve(accounts);
		this.emit('accountsChanged', accounts);
	}*/
}

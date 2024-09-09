import {IEngineAdapter, IResponseListener, IResponseListenerEntry, RequestFromView, ViewEvent} from "./IEngineAdapter";
import {ITokenScriptSDK} from "../types";

export class PostMessageAdapter implements IEngineAdapter {

	private responseListeners: Record<number, IResponseListenerEntry> = {};

	constructor(private sdk: ITokenScriptSDK) {

		window.addEventListener("message", this.handleMessageResponse.bind(this));

		// TODO: Move into SDK - this class should only me for messaging, not logic
		const closing = window.close;
		window.close = function () {
			this.postMessageToEngine(RequestFromView.CLOSE, undefined);
			closing();
		}.bind(this);

		//this.listenForUserValueChanges()
	}

	// TODO: Move into SDK - this class should only me for messaging, not logic
	/*private listenForUserValueChanges(){
		window.addEventListener('change', (evt) => {
			if (!("id" in evt.target) || !evt.target.id || (evt.target as HTMLElement).getAttribute("data-ts-prop") === "false")
				return;
			this.sendUserInputValues();
		});
	}*/

	private async handleMessageResponse(event: MessageEvent) {

		if (event.origin !== this.sdk.instanceData.engineOrigin)
			return;

		const params = event.data?.params;

		console.log("Event: ", event.data);

		switch (event.data?.method) {
			case ViewEvent.TOKENS_UPDATED:
				this.sdk.tokens.dataChanged(params.oldTokens, params.updatedTokens, params.cardId);
				//this.sdk.emitEvent("DATA_CHANGED", params);
				break;

			case ViewEvent.ON_CONFIRM:
				window.onConfirm();
				break;

			case ViewEvent.GET_USER_INPUT:
				this.sendUserInputValues();
				break;

			case ViewEvent.TRANSACTION_EVENT:
				this.sdk.emitEvent("TRANSACTION_EVENT", params);
		}

		if (params?.id && this.responseListeners[params.id]) {
			const listeners = this.responseListeners[params.id];

			if (params.error){
				console.error("Error from engine: ", params.error);
				listeners.reject(params.error);
				delete this.responseListeners[params.id];
				return;
			}

			try {

				const completed = await this.responseListeners[params.id].processResponse(event?.data.method, params);

				if (completed) {
					listeners.resolve(params);
					delete this.responseListeners[params.id];
				}

			} catch (e) {
				console.error("Error from response listener: ", e);
				listeners.reject(e);
				delete this.responseListeners[params.id];
			}
		}
	}

	private sendUserInputValues(){

		const inputs = Array.from(document.querySelectorAll("textarea,input")).filter((elem) => {
			return !!elem.id && elem.getAttribute("data-ts-prop") !== "false"
		}) as (HTMLInputElement|HTMLTextAreaElement)[];

		if (!inputs.length)
			return;

		const values = Object.fromEntries(inputs.map((elem) => {
			return [elem.id, elem.value];
		}));

		this.postMessageToEngine(RequestFromView.PUT_USER_INPUT, values);
	}

	private postMessageToEngine(method: RequestFromView, params){
		window.parent.postMessage({method, params}, {
			targetOrigin: this.sdk.instanceData.engineOrigin
		});
	}

	/**
	 *
	 * @param method The method to return to the view
	 * @param params The data for the request
	 * @param listener If true or a function, this function will return a promise which will be resolved once the request is completed
	 *                 If true, the first response received from the engine with the matching request ID will resolve the promise
	 *                 If a function is supplied, it is invoked to determine whether this is the last message and should resolve based on it's return boolean.
	 */
	async request(method: RequestFromView, params: any, listener?: true|IResponseListener<any>){

		if (listener){

			return new Promise<any>((resolve, reject) => {

				const id = Date.now();

				this.responseListeners[id] = {
					processResponse: async (event: ViewEvent, data: any) => {
						if (typeof listener === "function")
							return listener(event, data);
						return true;
					},
					resolve,
					reject
				};

				this.postMessageToEngine(method, {id, ...params});
			});
		}

		this.postMessageToEngine(method, params);
	}
}
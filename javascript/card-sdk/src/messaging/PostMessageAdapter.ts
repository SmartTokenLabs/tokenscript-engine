import {IEngineAdapter, IResponseListener, IResponseListenerEntry, RequestFromView, ViewEvent} from "./IEngineAdapter";
import {IWeb3LegacySDK} from "../types";

export class PostMessageAdapter implements IEngineAdapter {

	private responseListeners: Record<number, IResponseListenerEntry> = {};

	constructor(private sdk: IWeb3LegacySDK) {

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

		switch (event.data?.method) {
			case ViewEvent.TOKENS_UPDATED:
				this.sdk.tokens.dataChanged(params.oldTokens, params.updatedTokens, params.cardId);
				break;

			case ViewEvent.ON_CONFIRM:
				window.onConfirm();
				break;

			case ViewEvent.EXECUTE_CALLBACK:
				this.sdk.executeCallback(params.id, params.error, params.result);
				break;

			case ViewEvent.GET_USER_INPUT:
				this.sendUserInputValues();
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

	request(method: RequestFromView, params: any, listener?: true|IResponseListener<any>){

		if (listener){

			return new Promise<any>((resolve, reject) => {

				const id = Date.now();

				this.responseListeners[id] = {
					processResponse: (event: ViewEvent, data: any) => {
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
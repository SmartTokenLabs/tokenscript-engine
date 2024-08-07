import {IEngineAdapter, RequestFromView, ViewEvent} from "./IEngineAdapter";
import {IWeb3LegacySDK} from "../types";

export class PostMessageAdapter implements IEngineAdapter {

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

	private handleMessageResponse(event: MessageEvent){

		if (event.origin !== this.sdk.instanceData.engineOrigin)
			return;

		const params = event.data?.params;

		switch (event.data?.method){
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

	request(method: RequestFromView, params: any){
		this.postMessageToEngine(method, params);
	}
}
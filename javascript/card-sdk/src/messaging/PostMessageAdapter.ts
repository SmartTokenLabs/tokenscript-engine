import {IEngineAdapter, RequestFromView, ViewEvent} from "./IEngineAdapter";
import {ITokenScriptSDK} from "../types";

export class PostMessageAdapter implements IEngineAdapter {

	constructor(private sdk: ITokenScriptSDK, private origin: string) {

		window.addEventListener("message", this.handleMessageResponse);

		// TODO: Move into SDK - this class should only me for messaging, not logic
		const closing = window.close;
		window.close = function () {
			this.postMessageToEngine("close", undefined);
			closing();
		}.bind(this);

		this.listenForUserValueChanges()
	}

	// TODO: Move into SDK - this class should only me for messaging, not logic
	private listenForUserValueChanges(){
		window.addEventListener('change', (evt) => {
			if (!("id" in evt.target) || !evt.target.id)
				return;
			this.sendUserInputValues();
		});
	}

	private handleMessageResponse(event: MessageEvent){

		if (event.origin !== this.origin)
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

		const inputs = Array.from(document.querySelectorAll("textarea,input")).filter((elem) => !!elem.id) as (HTMLInputElement|HTMLTextAreaElement)[];

		if (!inputs.length)
			return;

		const values = Object.fromEntries(inputs.map((elem) => {
			return [elem.id, elem.value];
		}));

		this.postMessageToEngine(RequestFromView.PUT_USER_INPUT, values);
	}

	private postMessageToEngine(method, params){
		window.parent.postMessage({method, params}, {
			targetOrigin: this.origin
		});
	}

	request(method: RequestFromView, params: any){
		this.postMessageToEngine(method, params);
	}
}
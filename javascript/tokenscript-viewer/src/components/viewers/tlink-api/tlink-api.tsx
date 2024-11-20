import {Component, Event, EventEmitter, h, Host, JSX, Prop, State} from "@stencil/core";
import {AppRoot, ShowToastEventArgs} from "../../app/app";
import {ITransactionStatus} from "@tokenscript/engine-js/src/ITokenScript";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenCollection} from "@tokenscript/engine-js/src/tokens/ITokenCollection";
import {Card, CardType} from "@tokenscript/engine-js/src/tokenScript/Card";
import {handleTransactionError, showTransactionNotification} from "../util/showTransactionNotification";
import {getCardButtonClass} from "../util/getCardButtonClass";
import {ViewBinding} from "../tabbed/viewBinding";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";
import {getTokenScriptWithSingleTokenContext} from "../util/getTokenScriptWithSingleTokenContext";
import {getTokenUrlParams} from "../util/getTokenUrlParams";
import {connectEmulatorSocket} from "../util/connectEmulatorSocket";
import {ViewController} from "@tokenscript/engine-js/src/view/ViewController";
import {findCardByUrlParam} from "../util/findCardByUrlParam";
import {getRecaptchaToken} from "../../../integration/googleRecaptcha";
import {getTurnstileToken} from "../../../integration/turnstileCaptcha";

@Component({
	tag: 'tlink-api',
	styleUrl: 'tlink-api.css',
	shadow: false,
	scoped: false
})
export class TlinkApi {

	@Prop()
	app: AppRoot;

	async componentDidLoad(){

		const urlParams = new URLSearchParams(document.location.search);

		try {

			const method = urlParams.get("method");
			const payload = JSON.parse(urlParams.get("payload")) as { siteKey?: string, action?: string };

			switch (method) {

				case "getRecaptchaToken":
					return this.sendResponse({
						type: "TLINK_API_RESPONSE",
						response: await getRecaptchaToken(payload.siteKey, payload.action)
					});

				case "getTurnstileToken":
					return this.sendResponse({
						type: "TLINK_API_RESPONSE",
						response: await getTurnstileToken(payload.siteKey)
					});

				default:
					throw new Error("TLink API method is not supported: " + method);
			}
		} catch (e){
			this.sendResponse({
				type: "TLINK_API_RESPONSE",
				error: e
			})
		}
	}

	sendResponse(response: any){
		(window.opener ?? window.parent).postMessage(response, "*");
	}

	render(){

		return (
			<Host>
				<div class="tlink-viewer">
					<div class="tlink-header">
						<a href="https://www.smartlayer.network/" target="_blank">
							<img class="header-icon" alt="SmartLayer Network" src="assets/icon/smart-layer-icon.png"/>
							<span class="text">Tapp Viewer</span>
						</a>
					</div>
					<div class="request-message">
						<h4>Please wait...</h4>
					</div>
				</div>
			</Host>
		)
	}

}

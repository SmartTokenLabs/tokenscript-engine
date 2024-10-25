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

@Component({
	tag: 'tlink-card-viewer',
	styleUrl: 'tlink-card-viewer.css',
	shadow: false,
	scoped: false
})
export class TlinkCardViewer {

	@Prop()
	app: AppRoot;

	collectionDetails: ITokenCollection;
	tokenDetails: ITokenDetail;
	tokenId?: string;
	card?: string;

	@State()
	tokenScript: TokenScript;

	private mainCard?: Card;

	private mainCardView: HTMLElement;

	private mainViewController: ViewController;

	@Event({
		eventName: 'showToast',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) showToast: EventEmitter<ShowToastEventArgs>;

	@Event({
		eventName: 'showLoader',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) showLoader: EventEmitter<void>;

	@Event({
		eventName: 'hideLoader',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) hideLoader: EventEmitter<void>;

	async componentDidLoad(){

		try {
			await this.processUrlLoad();
		} catch (e){
			console.error(e);
			this.showToast.emit({
				type: 'error',
				title: "Failed to load token details",
				description: e.message
			});
		}
	}

	async processUrlLoad(){

		let {chain, contract, originId, tokenId, scriptId, tokenscriptUrl, emulator, card} = getTokenUrlParams();

		this.tokenId = tokenId;
		this.card = card;

		this.app.showTsLoader();

		if (emulator){
			const emulatorUrl = new URL(decodeURIComponent(emulator)).origin;
			tokenscriptUrl = emulatorUrl + "/tokenscript.tsml";
			connectEmulatorSocket(emulatorUrl, async() => {
				await this.loadTokenScript(chain, contract, tokenId, scriptId, tokenscriptUrl);
			});
		}

		await this.loadTokenScript(chain, contract, originId, tokenId, scriptId, tokenscriptUrl);

		this.app.hideTsLoader();
	}

	private async loadTokenScript(chain: number, contract: string, originId?: string, tokenId?: string, scriptId?: string, tokenScriptUrl?: string){

		this.tokenScript = await getTokenScriptWithSingleTokenContext(this.app, chain, contract, scriptId, originId, null, null, tokenId, tokenScriptUrl);

		await this.loadCard();
	}

	private async loadCard(reloadInfoView = false){

		if (!this.mainCard) {
			const cardRes = findCardByUrlParam(this.card, this.tokenScript);

			if (cardRes?.card) {
				if (await cardRes.card.isEnabledOrReason() === true) {
					this.mainCard = cardRes.card;
				}
			} else {
				this.showToast.emit({
					type: 'error',
					title: "Card not found",
					description: "The card '" + this.card + "' cannot be found."
				});
				return;
			}
		}

		// The card is already loaded, we only need to update other card buttons
		if (reloadInfoView || !this.mainViewController) {
			const mainViewBinding = new ViewBinding(this.mainCardView, this.showToast);
			this.tokenScript.setViewBinding(mainViewBinding);
			this.mainViewController = this.tokenScript.getViewController();
			mainViewBinding.setViewController(this.mainViewController);
			this.mainViewController.showOrExecuteCard(this.mainCard, undefined);
		}
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
						<div class="tlink-header-right">
							{/*<share-to-tg-button/>*/}
							{this.tokenScript && <security-status tokenScript={this.tokenScript} size="x-small" margin="0" />}
						</div>
					</div>
					<card-view ref={(el: HTMLElement) => this.mainCardView = el}></card-view>
				</div>
			</Host>
		)
	}

}

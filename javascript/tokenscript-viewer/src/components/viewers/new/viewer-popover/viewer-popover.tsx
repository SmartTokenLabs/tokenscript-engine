import {Component, Element, Event, EventEmitter, h, Host, JSX, Method, State} from "@stencil/core";
import {ITransactionStatus} from "@tokenscript/engine-js/src/ITokenScript";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {getCardButtonClass} from "../../util/getCardButtonClass";
import {handleTransactionError, showTransactionNotification} from "../../util/showTransactionNotification";
import {ShowToastEventArgs} from "../../../app/app";
import {TokenGridContext} from "../../util/getTokensFlat";
import {ScriptSourceType} from "../../../../../../engine-js/src/IEngine";
import {ScriptInfo} from "@tokenscript/engine-js/src/repo/sources/SourceInterface";
import {Web3WalletProvider} from "../../../wallet/Web3WalletProvider";

@Component({
	tag: 'viewer-popover',
	styleUrl: 'viewer-popover.css',
	shadow: false,
	scoped: false
})
export class ViewerPopover {

	@Element()
	host;

	@State()
	tokenScript?: TokenScript;

	@State()
	onboardingCards?: Card[];

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

	@Event({
		eventName: 'showScriptSelector',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) showScriptSelector: EventEmitter<ScriptInfo[]>;

	@State()
	private overflowCardButtons: JSX.Element[];
	private overflowDialog: HTMLActionOverflowModalElement;

	@State()
	private otherScripts: ScriptInfo[];

	@Method()
	async open(tokenScript: TokenScript){

		if (this.tokenScript)
			this.close();

		this.tokenScript = tokenScript;

		this.tokenScript.on("TOKENS_UPDATED", async (data) => {
			await this.loadOnboardingCards();
		}, "onboarding");

		// Update URL
		const params = new URLSearchParams(document.location.search);

		const sourceInfo = this.tokenScript.getSourceInfo();

		if (sourceInfo.source !== ScriptSourceType.UNKNOWN && !params.has("emulator")){
			switch (sourceInfo.source) {
				case ScriptSourceType.SCRIPT_REGISTRY:
				case ScriptSourceType.SCRIPT_URI:
					const [chain, contract, scriptId] = sourceInfo.tsId.split("-");
					if (contract) {
						params.set("chain", chain);
						params.set("contract", contract);
						if (scriptId)
							params.set("scriptId", scriptId);
					} else {
						params.set("tsId", sourceInfo.tsId);
					}
					break;
				case ScriptSourceType.URL:
					params.set("tokenscriptUrl", sourceInfo.sourceUrl);
					break;
			}
		}

		const location = new URL(document.location.href);
		location.search = params.toString();

		history.pushState(undefined, undefined, location);

		if (window.gtag) {
			let data: any = {
				tsIdOrUrl: sourceInfo.tsId ?? sourceInfo.sourceUrl,
				tsName: tokenScript.getName()
			};
			if (params.has("chain")){
				data.chain = params.get("chain");
				data.contract = "evm:" + params.get("contract");
				data.scriptId = params.get("scriptId");
			}
			window.gtag('set', data);
			window.gtag('event', 'tokenscript_opened', data);
		}

		await this.reloadOtherScripts();
	}

	private async loadOnboardingCards()
	{
		const onboardingCards = this.tokenScript.getCards().getOnboardingCards();

		const enabledCards = [];

		for (let [index, card] of onboardingCards.entries()){

			let label = card.label;

			if (label === "Unnamed Card")
				label = card.type === "token" ? "Token Info" : card.type + " Card";

			try {
				const enabled = await card.isEnabledOrReason();

				//console.log("Card enabled: ", enabled);

				if (enabled === false)
					continue;

				const cardElem = (
					<button class={"ts-card-button btn " + getCardButtonClass(card, index)}
					        onClick={() => this.showCard(card)}
					        disabled={enabled !== true}
					        title={enabled !== true ? enabled : label}>
						<span>{label}</span>
					</button>
				)

				enabledCards.push(cardElem);

			} catch (e){
				console.error("Failed to check if card is available", e);
			}
		}

		this.onboardingCards = enabledCards;
	}

	private async reloadOtherScripts(){
		this.otherScripts = null;

		if ([ScriptSourceType.SCRIPT_URI, ScriptSourceType.SCRIPT_REGISTRY].indexOf(this.tokenScript.getSourceInfo().source) === -1)
			return;

		try {
			this.otherScripts = await this.tokenScript.getEngine().resolveAllScripts(this.tokenScript.getSourceInfo().tsId);
		} catch (e){
			console.warn(e);
		}
	}

	private async showCard(card: Card, token?: TokenGridContext, cardIndex?: number){

		if (token) {
			const refs = token.contextId.split("-");
			this.tokenScript.setCurrentTokenContext(refs[0], refs.length > 1 ? parseInt(refs[1]) : null);
		} else {
			this.tokenScript.unsetTokenContext();
		}

		this.showLoader.emit();

		try {
			await this.tokenScript.showOrExecuteTokenCard(card, async (data: ITransactionStatus) => {

				if (data.status === "started")
					this.showLoader.emit();

				if (data.status === "completed")
					this.hideLoader.emit();

				await showTransactionNotification(data, this.showToast);
			});

		} catch(e){
			console.error(e);
			this.hideLoader.emit();
			handleTransactionError(e, this.showToast);
			return;
		}

		this.hideLoader.emit();
	}

	private async openActionOverflowModal(buttons: JSX.Element[]){
		this.overflowCardButtons = buttons;
		this.overflowDialog.openDialog();
	}

	@Method()
	close(){
		this.tokenScript = null;
		const location = new URL(document.location.href);
		const params = new URLSearchParams(document.location.search);
		params.delete("chain");
		params.delete("contract");
		params.delete("scriptId");
		params.delete("tsId");
		params.delete("tokenscriptUrl");
		location.search = params.toString();
		history.pushState(undefined, undefined, location);
	}

	render(){
		return ( this.tokenScript ?
			<Host class={(this.tokenScript ? " open" : "")}>
				<style innerHTML={this.tokenScript ? this.tokenScript.viewStyles.getViewCss() : ""}/>
				<div class="toolbar">
					<div class="view-heading">
						<button class="btn" onClick={() => this.close()}>&lt;</button>
						<h3>{this.tokenScript.getLabel(2) ?? this.tokenScript.getName()}</h3>
					</div>
					<div class="view-toolbar-buttons">
						{this.otherScripts?.length > 1 ? <button class="btn btn-secondary" style={{marginRight: "15px", minWidth: "35px", fontSize: "16px"}} onClick={async () =>{
							this.showScriptSelector.emit(this.otherScripts);
						}}>Other tapps</button> : ''}
						<share-to-tg-button></share-to-tg-button>
						<security-status tokenScript={this.tokenScript}/>
						<div>
							<button class="btn" style={{marginRight: "5px", minWidth: "35px", fontSize: "16px"}}
									onClick={() => {
										this.tokenScript.getCards().getAllCards().forEach((card) => {
											card.getAttributes().invalidate()
										})
										this.tokenScript.getAttributes().invalidate()
										this.tokenScript.getTokenMetadata(true, true)
									}}>↻
							</button>
							<wallet-button></wallet-button>
						</div>
					</div>
				</div>
				<div class="meta-details">
					{this.tokenScript.getMetadata().description ?
						<p>
							{this.tokenScript.getMetadata().description}
						</p> : ''
					}
					{this.tokenScript.getMetadata().aboutUrl ?
						<a class="how-it-works" href={this.tokenScript.getMetadata().aboutUrl} target="_blank">
							{"Discover how it works"}
							<img alt="about" src="/assets/icon/question.svg"/>
						</a> : ''
					}
				</div>
				{this.onboardingCards ? (<div class="onboarding-cards">
					{this.onboardingCards}
				</div>) : ''}
				<tokens-grid
					tokenScript={this.tokenScript}
					showCard={this.showCard.bind(this)}
					openActionOverflowModal={this.openActionOverflowModal.bind(this)}
				></tokens-grid>
				<action-overflow-modal ref={(el) => this.overflowDialog = el as HTMLActionOverflowModalElement}>
					<div class="actions">
						{this.overflowCardButtons}
					</div>
				</action-overflow-modal>
				<card-popover tokenScript={this.tokenScript}></card-popover>
				<token-info-popover id="token-info-popover" tokenScript={this.tokenScript}/>
				<token-security-status-popover id="token-security-status-popover"/>
			</Host> : ''
		)
	}
}


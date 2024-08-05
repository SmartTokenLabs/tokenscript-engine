import {Card} from "../../../../../engine-js/src/tokenScript/Card";
import {Attribute} from "../../../../../engine-js/src/tokenScript/Attribute";
import {RequestFromView, ViewEvent} from "@tokenscript/engine-js/src/view/ViewController";
import {JSX, h, EventEmitter} from "@stencil/core";
import {AbstractViewBinding} from "../../../integration/abstractViewBinding";
import {handleTransactionError, showTransactionNotification} from "../util/showTransactionNotification";
import {ITransactionStatus} from "@tokenscript/engine-js/src/TokenScript";
import {ShowToastEventArgs} from "../../app/app";
import {CHAIN_CONFIG} from "../../../integration/constants";
import {showToastNotification} from "../util/showToast";

export class ViewBinding extends AbstractViewBinding {

	constructor(protected view: HTMLElement,
				private showToast?: EventEmitter<ShowToastEventArgs>) {

		super(view);
	}

	async showTokenView(card: Card){

		(this.view as HTMLDivElement).style.display = "block";

		await super.showTokenView(card);

		this.renderAttributesTable();
	}

	async unloadTokenView(){
		(this.view as HTMLDivElement).style.display = "none";
		await super.unloadTokenView();
	}

	async renderAttributesTable(){
		const elem = this.view.querySelector(".attribute-table");

		if (!elem)
			return

		let attrTable = "<tr><th>Attribute</th><th>Value</th></tr>";

		const rowRender = async (attr: Attribute, isLocal = false) => {
			return `<tr><td>${attr.getName()} ${isLocal? "(Card)" : "(Global)"}</td><td>${await attr.getCurrentValue()}</td></tr>`;
		}

		for (let attr of this.tokenScript.getAttributes()){
			attrTable += await rowRender(attr);
		}

		for (let attr of this.currentCard.getAttributes()){
			attrTable += await rowRender(attr, true);
		}

		elem.innerHTML = attrTable;
	}

	async confirmAction(txName?: string){

		this.showLoader();

		try {
			await this.viewController.executeTransaction((data: ITransactionStatus) => {
				showTransactionNotification(data, this.showToast);
			}, txName);
		} catch (e){
			console.error(e);
			handleTransactionError(e, this.showToast);
		}

		this.hideLoader();
	}

	async handleMessageFromView(method: RequestFromView, params: any){

		switch (method){
			case RequestFromView.SET_LOADER:
				if (params.show == true){
					this.showLoader();
				} else {
					this.hideLoader();
				}
				break;
			case RequestFromView.SHOW_TX_TOAST:
				showTransactionNotification({
					status: params.status,
					txLink: CHAIN_CONFIG[params?.chain].explorer ?  CHAIN_CONFIG[params?.chain].explorer + params.txHash : null,
					txNumber: params.txHash
				}, this.showToast)
				break;
			case RequestFromView.SHOW_TOAST:
				showToastNotification(params.type, params.title, params.description);
				break;
			case RequestFromView.EXEC_TRANSACTION:
				await this.confirmAction(params.txName);
				break;
			default:
				await super.handleMessageFromView(method, params);
		}

		if (method === RequestFromView.PUT_USER_INPUT)
			this.renderAttributesTable();
	}

	async dispatchViewEvent(event: ViewEvent, data: any, id: string) {

		await super.dispatchViewEvent(event, data, id);

		if (event === ViewEvent.TOKENS_UPDATED)
			this.renderAttributesTable();
	}
}

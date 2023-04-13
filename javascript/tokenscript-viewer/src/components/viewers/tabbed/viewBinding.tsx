import {Card} from "../../../../../engine-js/src/tokenScript/Card";
import {Attribute} from "../../../../../engine-js/src/tokenScript/Attribute";
import {RequestFromView, ViewEvent} from "@tokenscript/engine-js/src/view/ViewController";
import {JSX, h} from "@stencil/core";
import {AbstractViewBinding} from "../../../integration/abstractViewBinding";

export class ViewBinding extends AbstractViewBinding {

	constructor(protected view: HTMLElement,
				private showToast?: (type: 'success'|'info'|'warning'|'error', title: string, description:string|JSX.Element) => void) {

		super(view);
	}

	async showTokenView(card: Card){

		(this.view.querySelector(".view-container") as HTMLDivElement).style.display = "block";

		await super.showTokenView(card);

		this.renderAttributesTable();
	}

	async unloadTokenView(){
		(this.view.querySelector(".view-container") as HTMLDivElement).style.display = "none";
		await super.unloadTokenView();
	}

	async renderAttributesTable(){
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

		this.view.querySelector(".attribute-table").innerHTML = attrTable;
	}

	// TODO: move this logic into engine
	async confirmAction(){

		const transaction = this.currentCard.getTransaction();

		this.showLoader();

		if (transaction){

			console.log(transaction.getTransactionInfo());

			try {
				await this.currentCard.executeTransaction((data) => {
					switch (data.status){
						case "submitted":
							this.showToast(
								'info',
								"Transaction submitted",
								(<span>
									{"Processing TX, please wait.. "}<br/>
									{"TX Number: " + data.txNumber }
								</span>)
							);
							break;
						case "confirmed":
							this.showToast(
								'success',
								"Transaction confirmed",
								(<span>
									{"TX " + data.txNumber + " confirmed!"}<br/>{
									data.txLink ? <a href={data.txLink} target="_blank">{"View On Block Scanner"}</a> : ''}
								</span>)
							);
							break;
					}
				});
			} catch (e){
				console.error(e);
				this.showToast('error', "Transaction Error", e.message);
			}

		} else {
			// this.iframe.contentWindow.onConfirm();
			this.postMessageToView(ViewEvent.ON_CONFIRM, {});
		}

		this.hideLoader();
	}

	async handleMessageFromView(method: RequestFromView, params: any){

		await super.handleMessageFromView(method, params);

		if (method === RequestFromView.PUT_USER_INPUT)
			this.renderAttributesTable();
	}

	async dispatchViewEvent(event: ViewEvent, data: any, id: string) {

		await super.dispatchViewEvent(event, data, id);

		if (event === ViewEvent.TOKENS_UPDATED)
			this.renderAttributesTable();
	}
}

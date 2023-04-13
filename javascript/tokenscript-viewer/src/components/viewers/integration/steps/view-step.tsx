import {Component, Prop, h, State, Element} from "@stencil/core";
import {IntegrationViewer} from "../integration-viewer";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {AbstractViewBinding} from "../../../../integration/abstractViewBinding";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {ViewEvent} from "@tokenscript/engine-js/src/view/ViewController";

@Component({
	tag: 'view-step',
	styleUrl: 'view-step.css',
	shadow: false,
	scoped: false
})
export class ViewStep {

	@Element()
	host: HTMLElement;

	@Prop()
	viewer: IntegrationViewer

	@Prop()
	tokenScript: TokenScript

	@Prop()
	card: Card;

	viewBinding;

	async componentDidLoad() {
		this.viewBinding = new ViewBinding(this.host);
		this.viewBinding.setTokenScript(this.tokenScript);
		this.tokenScript.setViewBinding(this.viewBinding);
		this.tokenScript.getViewController().showCard(this.card);
	}

	render() {
		return (
			<div class="card-container">
				<div style={{position: "relative"}}>
					<div class="view-loader" style={{display: "none"}}>
						<loading-spinner/>
					</div>
					<iframe class="tokenscript-frame"
							sandbox="allow-scripts allow-modals allow-forms">
					</iframe>
				</div>
				<div class="action-bar" style={{display: "none"}}>
					<button class="action-btn btn btn-primary"></button>
				</div>
			</div>
		);
	}
}

class ViewBinding extends AbstractViewBinding {

	constructor(view: HTMLElement) {
		super(view);

	}

	async confirmAction() {
		const transaction = this.currentCard.getTransaction();

		this.showLoader();

		if (transaction){

			console.log(transaction.getTransactionInfo());

			try {
				await this.currentCard.executeTransaction((data) => {
					switch (data.status){
						case "submitted":
							/*this.showToast(
								'info',
								"Transaction submitted",
								(<span>
									{"Processing TX, please wait.. "}<br/>
									{"TX Number: " + data.txNumber }
								</span>)
							);*/
							break;
						case "confirmed":
							/*this.showToast(
								'success',
								"Transaction confirmed",
								(<span>
									{"TX " + data.txNumber + " confirmed!"}<br/>{
									data.txLink ? <a href={data.txLink} target="_blank">{"View On Block Scanner"}</a> : ''}
								</span>)
							);*/
							break;
					}
				});
			} catch (e){
				console.error(e);
				//this.showToast('error', "Transaction Error", e.message);
			}

		} else {
			// this.iframe.contentWindow.onConfirm();
			this.postMessageToView(ViewEvent.ON_CONFIRM, {});
		}

		this.hideLoader();
	}
}

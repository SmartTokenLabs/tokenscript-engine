import {Component, Prop, h, Element, Event, EventEmitter} from "@stencil/core";
import {IntegrationViewer} from "../integration-viewer";
import {ITransactionStatus, TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {AbstractViewBinding} from "../../../../integration/abstractViewBinding";
import {Card} from "@tokenscript/engine-js/src/tokenScript/Card";
import {ShowToastEventArgs} from "../../../app/app";

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

	@Event({
		eventName: 'showToast',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) showToast: EventEmitter<ShowToastEventArgs>;

	viewBinding;

	async componentDidLoad() {
		this.viewBinding = new ViewBinding(this);
		this.viewBinding.setTokenScript(this.tokenScript);
		this.tokenScript.setViewBinding(this.viewBinding);
		// TODO: Add transaction notifications and loader for transaction-only cards
		this.tokenScript.showOrExecuteTokenCard(this.card);
	}

	render() {
		return (
			<div>
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
			</div>
		);
	}
}

class ViewBinding extends AbstractViewBinding {

	constructor(private viewStep: ViewStep) {
		super(viewStep.host);
	}

	async confirmAction() {

		const transaction = this.currentCard.getTransaction();

		this.showLoader();

		const data: ITransactionStatus = {
			status: "confirmed",
			txNumber: "0x000",
			txLink: "https://google.com/"
		}

		setTimeout(() => {

			this.viewStep.showToast.emit({
				type: 'info',
				title: "Transaction submitted",
				description: (<span>
					{"Processing TX, please wait.. "}<br/>
					{"TX Number: " + data.txNumber}
				</span>)
			});

			setTimeout(() => {

				this.viewStep.showToast.emit({
					type: 'success',
					title: "Transaction confirmed",
					description: (<span>
						{"TX " + data.txNumber + " confirmed!"}<br/>
						{data.txLink ? <a href={data.txLink} target="_blank">{"View On Block Scanner"}</a> : ''}
					</span>)
				});

				this.hideLoader();

				setTimeout(() => {
					console.log("Transaction completed!");

					this.viewStep.viewer.returnResultToRequester(data);
				}, 1000);

			}, 3000);

		}, 1000);

		/*if (transaction){

			console.log(transaction.getTransactionInfo());

			try {
				await this.currentCard.executeTransaction((data) => {
					switch (data.status){
						case "submitted":

							break;
						case "confirmed":

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

		this.hideLoader();*/
	}
}

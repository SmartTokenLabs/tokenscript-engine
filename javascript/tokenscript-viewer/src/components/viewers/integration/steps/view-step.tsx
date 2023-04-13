import {Component, Prop, h, State, Element, JSX} from "@stencil/core";
import {IntegrationViewer} from "../integration-viewer";
import {ITransactionStatus, TokenScript} from "@tokenscript/engine-js/src/TokenScript";
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
		this.viewBinding = new ViewBinding(this);
		this.viewBinding.setTokenScript(this.tokenScript);
		this.tokenScript.setViewBinding(this.viewBinding);
		this.tokenScript.getViewController().showCard(this.card);
	}

	showToast(type: 'success'|'info'|'warning'|'error', title: string, description: string|JSX.Element){

		const cbToast = this.host.querySelector(".toast") as HTMLCbToastElement;

		cbToast.Toast({
			title,
			description,
			timeOut: 30000,
			position: 'top-right',
			type
		});
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
				<cb-toast className="toast"></cb-toast>
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

			this.viewStep.showToast(
				'info',
				"Transaction submitted",
				(<span>
									{"Processing TX, please wait.. "}<br/>
					{"TX Number: " + data.txNumber }
								</span>)
			);

			setTimeout(() => {

				this.viewStep.showToast(
					'success',
					"Transaction confirmed",
					(<span>
									{"TX " + data.txNumber + " confirmed!"}<br/>{
						data.txLink ? <a href={data.txLink} target="_blank">{"View On Block Scanner"}</a> : ''}
								</span>)
				);

				this.hideLoader();

				setTimeout(() => {
					console.log("Transaction completed!");

					this.viewStep.viewer.returnResultToRequester(data);
				}, 3000);

			}, 5000);

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
		}*/



		this.hideLoader();
	}
}

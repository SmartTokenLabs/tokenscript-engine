import {Component, Prop, h, State, Element} from "@stencil/core";
import {IntegrationViewer} from "../integration-viewer";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {AbstractViewBinding} from "../../../../integration/abstractViewBinding";

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

	viewBinding;

	async componentDidLoad() {
		this.viewBinding = new ViewBinding(this.host);
		this.viewBinding.setTokenScript(this.tokenScript);
		this.tokenScript.setViewBinding(this.viewBinding);
		this.tokenScript.getViewController().showCard(this.tokenScript.getCards()[0]);
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

	confirmAction() {
		console.log("TS confirm");
	}
}

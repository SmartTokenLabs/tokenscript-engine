import {Component, h, JSX, Prop, Watch, Element} from "@stencil/core";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ViewBinding} from "../../viewers/tabbed/viewBinding";

@Component({
	tag: 'card-modal',
	styleUrl: 'card-modal.css',
	shadow: false,
	scoped: false
})
export class CardModal {

	@Element()
	host: HTMLElement;

	@Prop()
	tokenScript?: TokenScript;

	// TODO: Migrate view binding related code to card-view component
	viewBinding: ViewBinding;

	@Watch('tokenScript')
	async loadTs(){

		if (!this.viewBinding){
			this.viewBinding = new ViewBinding(this.host, this.showToast.bind(this));
		}

		this.viewBinding.setTokenScript(this.tokenScript);
		this.tokenScript.setViewBinding(this.viewBinding);
	}

	componentDidLoad() {
		if (this.tokenScript)
			this.loadTs();
	}
	// END TODO

	// TODO: Use event to improve repetition
	showToast(type: 'success'|'info'|'warning'|'error', title: string, description: string|JSX.Element){

		const cbToast = document.querySelector(".toast") as HTMLCbToastElement;

		cbToast.Toast({
			title,
			description,
			timeOut: 30000,
			position: 'top-right',
			type
		});
	}

	render(){
		// TODO: Remove need for view container class (currently referenced in view adapter)
		return (
			<div class="view-container" style={{display: "none"}}>
				<button class="close-btn" onClick={() => {
					document.location.hash = "#";
					this.tokenScript.getViewController().unloadTokenCard();
				}}>X
				</button>
				<card-view></card-view>
				<attribute-table></attribute-table>
			</div>
		)
	}
}

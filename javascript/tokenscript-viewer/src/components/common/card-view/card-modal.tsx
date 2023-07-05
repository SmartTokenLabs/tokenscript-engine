import {Component, h, JSX, Prop, Watch, Element, Event, EventEmitter} from "@stencil/core";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ViewBinding} from "../../viewers/tabbed/viewBinding";
import {ShowToastEventArgs} from "../../app/app";

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

	@Event({
		eventName: 'showToast',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) showToast: EventEmitter<ShowToastEventArgs>;

	// TODO: Migrate view binding related code to card-view component
	viewBinding: ViewBinding;

	@Watch('tokenScript')
	async loadTs(){

		if (!this.viewBinding){
			this.viewBinding = new ViewBinding(this.host, (type: 'success'|'info'|'warning'|'error', title: string, description: string|JSX.Element) => {
				this.showToast.emit({type, title, description});
			});
		}

		this.viewBinding.setTokenScript(this.tokenScript);
		this.tokenScript.setViewBinding(this.viewBinding);
	}

	componentDidLoad() {
		if (this.tokenScript)
			this.loadTs();
	}
	// END TODO

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
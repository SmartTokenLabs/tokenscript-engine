import {Component, Element, Event, EventEmitter, h, JSX, Prop, Watch} from "@stencil/core";
import {Components} from "../../../../components";
import {TokenScript} from "../../../../../../engine-js/src/TokenScript";
import {ViewBinding} from "../viewBinding";
import AppRoot = Components.AppRoot;
import "cb-toast";
import {WalletConnection, Web3WalletProvider} from "../../../wallet/Web3WalletProvider";
import {ShowToastEventArgs} from "../../../app/app";

@Component({
	tag: 'viewer-tab',
	styleUrl: 'viewer-tab.css',
	shadow: false,
	scoped: false
})
export class ViewerTab {

	@Element() host: HTMLElement;

	@Prop() app: AppRoot;
	@Prop() tabId: string;

	@Prop() tokenScript: TokenScript;

	@Event({
		eventName: 'showToast',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) showToast: EventEmitter<ShowToastEventArgs>;

	viewBinding: ViewBinding;

	uuid = Date.now();

	constructor() {
		Web3WalletProvider.registerWalletChangeListener(this.handleWalletChange.bind(this));
	}

	handleWalletChange(walletConnection: WalletConnection|undefined){
		if (walletConnection){
			this.tokenScript.getTokenMetadata(true);
		} else {
			this.tokenScript.setTokenMetadata([]);
		}
	}

	@Watch('tokenScript')
	async loadTs(){

		if (!this.viewBinding){
			this.viewBinding = new ViewBinding(this.host,(type: 'success'|'info'|'warning'|'error', title: string, description: string|JSX.Element) => {
				this.showToast.emit({type, title, description});
			});
		}

		this.viewBinding.setTokenScript(this.tokenScript);
		this.tokenScript.setViewBinding(this.viewBinding);
	}

	componentDidLoad() {
		if (this.tokenScript)
			this.loadTs();

		// TODO: hacky fix to get it positioned below the tab bar
		document.querySelector(".toast").shadowRoot
			.querySelector(":host > div")
			.setAttribute("style", "margin-top: 100px;");
	}

	render() {
		return (
			<div>
				<div class="toolbar">
					<security-status tokenScript={this.tokenScript}/>
					<div>
						<button class="btn" style={{marginRight: "5px", minWidth: "35px", fontSize: "16px"}} onClick={() => this.tokenScript.getTokenMetadata(true, true)}>↻</button>
						<wallet-button></wallet-button>
					</div>
				</div>
				<tokens-grid tokenScript={this.tokenScript}></tokens-grid>
				<card-modal tokenScript={this.tokenScript}></card-modal>
			</div>
		);
	}
}

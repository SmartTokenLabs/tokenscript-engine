import {Component, Element, h, JSX, Prop, Watch} from "@stencil/core";
import {Components} from "../../../../components";
import {TokenScript} from "../../../../../../engine-js/src/TokenScript";
import {ViewBinding} from "../viewBinding";
import AppRoot = Components.AppRoot;
import "cb-toast";
import {WalletConnection, Web3WalletProvider} from "../../../wallet/Web3WalletProvider";

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

	viewBinding: ViewBinding;

	uuid = Date.now();

	discoveryAdapter;

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
			this.viewBinding = new ViewBinding(this.host, this.showToast.bind(this));
		}

		this.viewBinding.setTokenScript(this.tokenScript);
		this.tokenScript.setViewBinding(this.viewBinding);
	}

	componentDidLoad() {
		if (this.tokenScript)
			this.loadTs();

		// TODO: hacky fix to get it positioned below the tab bar
		this.host.querySelector(".toast").shadowRoot
			.querySelector(":host > div")
			.setAttribute("style", "margin-top: 100px;");
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
				<div class="toolbar">
					<security-status tokenScript={this.tokenScript}/>
					<wallet-button></wallet-button>
				</div>
				<tokens-grid tokenScript={this.tokenScript} showToast={this.showToast.bind(this)}></tokens-grid>
				<div class="view-container" style={{display: "none"}}>
					<button class="close-btn" onClick={() => {
						document.location.hash = "#";
						this.tokenScript.getViewController().unloadTokenCard();
					}}>X</button>
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
					<attribute-table></attribute-table>
				</div>
				<cb-toast class="toast"></cb-toast>
			</div>
		);
	}
}

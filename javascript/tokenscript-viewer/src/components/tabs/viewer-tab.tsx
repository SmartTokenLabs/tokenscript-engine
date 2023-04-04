import {Component, Element, h, JSX, Prop, Watch} from "@stencil/core";
import {Components} from "../../components";
import {TokenScript} from "../../../../engine-js/src/TokenScript";
import {ViewBinding} from "../../integration/viewBinding";
import AppRoot = Components.AppRoot;
import {Client} from "@tokenscript/token-negotiator";
import "@tokenscript/token-negotiator/dist/theme/style.css";
import {TokenNegotiatorDiscovery} from "../../integration/discoveryAdapter";
import "cb-toast";

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

	negotiator: Client = new Client({
		'type': 'active',
		'issuers': [],
		'uiOptions': {
			'containerElement': '#tn-' + this.uuid,
			'theme': 'light',
			'openingHeading': 'Connect your wallet to load this TokenScripts tokens.'
		}
	});

	discoveryAdapter;

	@Watch('tokenScript')
	async loadTs(){

		if (!this.viewBinding){
			this.viewBinding = new ViewBinding(this.host, this.showToast.bind(this));
		}

		this.viewBinding.setTokenScript(this.tokenScript);
		this.tokenScript.setViewBinding(this.viewBinding);
	}

	componentWillLoad(){
		if (this.tokenScript) {
			this.discoveryAdapter = new TokenNegotiatorDiscovery(this.negotiator, this.tokenScript);
			this.tokenScript.setTokenDiscoveryAdapter(this.discoveryAdapter);
		}
	}

	private currentProvider;

	connectedCallback(){
		this.setupTnInstanceGlue();
	}

	disconnectedCallback(){
		window.removeEventListener("tn-wallet-change", this.walletChangeListener);
		this.negotiator.on('connected-wallet', () => {});
		this.negotiator.on('tokens-selected', () => {});
		this.negotiator = null;
		this.discoveryAdapter = null;
	}

	private async setupTnInstanceGlue(){

		this.currentProvider = (await this.negotiator.getWalletProvider()).getConnectedWalletData()[0]?.providerType;

		// TODO: Wallet connect event is extremely unreliable - fix it
		this.negotiator.on("connected-wallet", (event) => {

			const providerType = event?.data?.providerType;

			//console.log("TN IPC " + (this.uuid) + ": Connected/disconnect wallet", providerType);

			// Only fires this event if the wallet is changed, not for address changes for the same wallet provider
			if (providerType == this.currentProvider)
				return;

			this.currentProvider = providerType;
			this.dispatchWalletChangedEvent(providerType);
		});

		window.addEventListener("tn-wallet-change", this.walletChangeListener)
	}

	private walletChangeListener = async (e: CustomEvent) => {

		if (e.detail.id === this.uuid)
			return;

		console.log("TN IPC " + (this.uuid) + ": Processing tn-wallet-change");

		const provider = await this.negotiator.getWalletProvider();

		this.currentProvider = e.detail.provider;

		if (!e.detail.provider) {
			console.log("TN IPC: Disconnect");
			//provider.deleteConnections();
			await this.negotiator.disconnectWallet();
			this.negotiator.getUi().updateUI('wallet');
			return;
		}

		console.log("TN IPC: Connect");

		//const currentAddr = provider.getConnectedWalletData()[0]?.address;
		await provider.loadConnections();
		//const newAddr = provider.getConnectedWalletData()[0]?.address;

		// TODO: Not working due to limitations in negotiator
		//if (currentAddr !== newAddr)
			//this.negotiator.getTokenStore().clearCachedTokens();

		if (this.negotiator.getUi())
			this.negotiator.getUi().updateUI('main');
	}

	private dispatchWalletChangedEvent(provider){
		console.log("TN IPC " + (this.uuid) + ": Sending TN event, disconnect: ", provider);
		const event = new CustomEvent("tn-wallet-change", {detail: {id: this.uuid, provider: provider }});
		window.dispatchEvent(event);
	}

	componentWillUpdate(){
		this.discoveryAdapter = new TokenNegotiatorDiscovery(this.negotiator, this.tokenScript);
		this.tokenScript.setTokenDiscoveryAdapter(this.discoveryAdapter);
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
				<security-status tokenScript={this.tokenScript}/>
				<div id={'tn-' + this.uuid} class="overlay-tn light-tn"></div>
				<cb-toast class="toast"></cb-toast>
			</div>
		);
	}
}

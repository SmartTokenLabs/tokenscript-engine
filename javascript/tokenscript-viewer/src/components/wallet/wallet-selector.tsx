import {Component, h, Method, State} from "@stencil/core";
import {SupportedWalletProviders} from "./Web3WalletProvider";
import {foxWallet, getWalletInfo, WalletInfo} from "./WalletInfo";

@Component({
	tag: 'wallet-selector',
	styleUrl: 'wallet-selector.css',
	shadow: false,
	scoped: false
})
export class WalletSelector {

	@State()
	providerList: WalletInfo[];

	private dialog;

	private selectCallback: (res: SupportedWalletProviders) => void

	private closeCallback: (error: string) => void

	@Method()
	async connectWallet(): Promise<SupportedWalletProviders> {
		this.dialog.openDialog(() => {
			this.closeCallback("Wallet connection aborted.")
		});

		return new Promise((resolve, reject) => {
			this.selectCallback = resolve;
			this.closeCallback = reject;
		});
	}

	componentWillLoad(){

		const providers = [];

		if (typeof window.ethereum !== 'undefined') {
			providers.push(getWalletInfo(SupportedWalletProviders.MetaMask));
		}

		// providers.push(getWalletInfo(SupportedWalletProviders.WalletConnect));
		providers.push(getWalletInfo(SupportedWalletProviders.WalletConnectV2));

		providers.push(getWalletInfo(SupportedWalletProviders.CoinbaseSmartWallet));

		// Show FoxWallet option to trigger WalletConnect if the user is not using FoxWallet DApp browser
		if (!window.foxwallet){
			providers.push({
				name: SupportedWalletProviders.WalletConnectV2,
				...foxWallet
			} as WalletInfo);
		}

		providers.push(getWalletInfo(SupportedWalletProviders.Torus));

		if (typeof window.gatewallet !== 'undefined') {
			providers.push(getWalletInfo(SupportedWalletProviders.Gate));
		}

		this.providerList = providers
	}

	componentDidLoad(){
		//this.dialog.openDialog();
	}

	render(){
		return (
			<popover-dialog ref={el => this.dialog = el as HTMLPopoverDialogElement}>
				<h4>Select Wallet</h4>
				<p>You need to connect your wallet to get access to your tokens.</p>
				{
					this.providerList.map((provider) => {
						return (
							<button class="btn wallet-btn" onClick={
								() => {
									this.selectCallback(provider.name);
									this.dialog.closeDialog();
								}
							}>
								<div class="wallet-icon" innerHTML={provider.imgBig} style={{overflow: "hidden"}}></div>
								<div class="wallet-name">{provider.label}</div>
							</button>
						)
					})
				}
			</popover-dialog>
		)
	}
}

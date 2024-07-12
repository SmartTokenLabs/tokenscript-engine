import {Component, h, Method, State} from "@stencil/core";
import {SupportedWalletProviders, Web3WalletProvider} from "./Web3WalletProvider";
import {WALLET_LIST, WalletInfo} from "./WalletInfo";

@Component({
	tag: 'wallet-selector',
	styleUrl: 'wallet-selector.css',
	shadow: false,
	scoped: false
})
export class WalletSelector {

	@State()
	providerList: WalletInfo[];

	@State()
	otherWallets: Omit<WalletInfo, "id">[];

	private dialog;

	private selectCallback: (res: SupportedWalletProviders) => void

	private closeCallback: (error: string) => void

	@Method()
	async connectWallet(): Promise<SupportedWalletProviders> {
		this.dialog.openDialog(() => {
			this.closeCallback("Wallet connection aborted.")
		});

		return new Promise<SupportedWalletProviders>((resolve, reject) => {
			this.selectCallback = resolve;
			this.closeCallback = reject;
		});
	}

	componentWillLoad(){
		this.providerList = Web3WalletProvider.getAvailableProviders();
		this.otherWallets = Object.values(WALLET_LIST).filter((walletInfo) => {
			if ("Embedded Wallet" === walletInfo.label)
				return false;
			return !this.providerList.find((providerInfo) => {
				return providerInfo.label === walletInfo.label
			});
		})
	}

	componentDidLoad(){
		//this.dialog.openDialog();
	}

	render(){
		return (
			<popover-dialog ref={el => this.dialog = el as HTMLPopoverDialogElement}>
				<h3>Select Wallet</h3>
				<p>You need to connect your wallet to get access to your tokens.</p>
				<h4 class="wallet-list-heading">Your wallets</h4>
				<div class="wallets-list">
				{
					this.providerList.map((provider) => {
						return (
							<button class="btn wallet-btn" onClick={
								() => {
									this.selectCallback(provider.id);
									this.dialog.closeDialog();
								}
							}>
								<div class="wallet-icon" innerHTML={provider.icon} style={{overflow: "hidden"}}></div>
								<div class="wallet-name">{provider.label}</div>
							</button>
						)
					})
				}
				</div>
				<h4 class="wallet-list-heading">Other</h4>
				<div class="wallets-list">
				{
					this.otherWallets.map((walletInfo) => {
						return (
							<button class="btn wallet-btn" onClick={
								() => {

								}
							}>
								<div class="wallet-icon" innerHTML={walletInfo.icon} style={{overflow: "hidden"}}></div>
								<div class="wallet-name">{walletInfo.label}</div>
							</button>
						)
					})
				}
				</div>
			</popover-dialog>
		)
	}
}

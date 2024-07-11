import {Component, h, Method, State} from "@stencil/core";
import {SupportedWalletProviders, Web3WalletProvider} from "./Web3WalletProvider";
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

		return new Promise<SupportedWalletProviders>((resolve, reject) => {
			this.selectCallback = resolve;
			this.closeCallback = reject;
		});
	}

	componentWillLoad(){
		this.providerList = Web3WalletProvider.getAvailableProviders();
	}

	componentDidLoad(){
		//this.dialog.openDialog();
	}

	render(){
		return (
			<popover-dialog ref={el => this.dialog = el as HTMLPopoverDialogElement}>
				<h4>Select Wallet</h4>
				<p>You need to connect your wallet to get access to your tokens.</p>
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
			</popover-dialog>
		)
	}
}

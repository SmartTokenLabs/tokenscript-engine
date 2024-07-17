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

	shuffle(array) {
		let currentIndex = array.length;

		// While there remain elements to shuffle...
		while (currentIndex != 0) {

			// Pick a remaining element...
			let randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			// And swap it with the current element.
			[array[currentIndex], array[randomIndex]] = [
				array[randomIndex], array[currentIndex]];
		}
	}

	componentWillLoad(){
		this.providerList = Web3WalletProvider.getAvailableProviders();

		let walletList = Object.values(WALLET_LIST).filter((walletInfo) => {
			if ("Embedded Wallet" === walletInfo.label)
				return false;
			if (!walletInfo.onboardingLink)
				return false;
			return !this.providerList.find((providerInfo) => {
				return providerInfo.label === walletInfo.label
			});
		});

		this.shuffle(walletList);

		// FoxWallet always first for now
		const foxWalletIndex = walletList.findIndex((wallet) => wallet.label === "FoxWallet");
		if (foxWalletIndex > -1) {
			const foxWallet = walletList.splice(foxWalletIndex, 1);
			walletList.unshift(...foxWallet);
		}

		this.otherWallets = walletList;
	}

	componentDidLoad(){
		//this.dialog.openDialog();
	}

	render(){
		return (
			<popover-dialog ref={el => this.dialog = el as HTMLPopoverDialogElement}>
				<h3>Select Wallet</h3>
				<p>You need to connect your wallet to get access to your tokens.</p>
				<small>Choose WalletConnect if you have a mobile or desktop wallet that supports it.</small>
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
				<h4 class="wallet-list-heading">Partner Wallets</h4>
				<div class="wallets-list">
				{
					this.otherWallets.map((walletInfo) => {
						return (
							<button class="btn wallet-btn" onClick={
								() => {
									window.open(walletInfo.onboardingLink, "_blank");
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

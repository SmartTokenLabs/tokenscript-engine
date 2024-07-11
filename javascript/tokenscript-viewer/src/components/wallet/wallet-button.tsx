import {Component, h, State} from "@stencil/core";
import {getWalletInfo, WalletInfo} from "./WalletInfo";
import {WalletConnection, Web3WalletProvider} from "./Web3WalletProvider";

@Component({
	tag: 'wallet-button',
	styleUrl: 'wallet-button.css',
	shadow: false,
	scoped: false
})
export class WalletButton {

	@State()
	walletInfo?: WalletInfo & WalletConnection;

	@State()
	dropdownOpened = false;

	async connectedCallback(){

		const wallet = await Web3WalletProvider.getWallet();
		await this.updateWalletConnectionState(wallet);

		Web3WalletProvider.registerWalletChangeListener(this.updateWalletConnectionState.bind(this));
		document.addEventListener("click", this.dismissClickHandler.bind(this));
	}

	async disconnectedCallback(){
		Web3WalletProvider.removeWalletChangeListener(this.updateWalletConnectionState.bind(this));
		document.removeEventListener("click", this.dismissClickHandler.bind(this))
	}

	private dismissClickHandler(_e: Event){
		this.dropdownOpened = false;
	}

	private async updateWalletConnectionState(wallet: WalletConnection){

		if (!wallet){
			this.walletInfo = null;
			return;
		}

		this.walletInfo = {...wallet, ...Web3WalletProvider.getProviderInfo(wallet.providerType)};

		console.log(this.walletInfo);
	}

	private formatWalletAddress(address: string){
		return address.substring(0, 4) + "..." + address.substring(address.length - 4);
	}

	render(){
		return (
			<div class="btn-container" onClick={(e) => e.stopPropagation()}>
				<button class={"btn wallet-connect-btn " + (this.walletInfo ? 'btn-connected' : 'btn-primary')} onClick={() => {

					if (this.walletInfo){
						// await Web3WalletProvider.disconnectWallet();
						this.dropdownOpened = !this.dropdownOpened;
					} else {
						Web3WalletProvider.getWallet(true);
					}
				}}>
					{ this.walletInfo ? ([
						<div class="icon-container" innerHTML={this.walletInfo.icon}></div>,
						<div title={this.walletInfo.label + ": " + this.walletInfo.address}>{this.formatWalletAddress(this.walletInfo.address)}</div>,
						<div class="chevron"></div>
					]) : 'Connect Wallet'}
				</button>
				{ this.dropdownOpened ?
					<div class="btn-dropdown">
						<button onClick={() => {
							this.dropdownOpened = false;
							Web3WalletProvider.disconnectWallet();
						}}>Disconnect</button>
						<button onClick={() => {
							this.dropdownOpened = false;
							Web3WalletProvider.switchWallet();
						}}>Switch</button>
					</div> : ''
				}
			</div>
		)
	}
}

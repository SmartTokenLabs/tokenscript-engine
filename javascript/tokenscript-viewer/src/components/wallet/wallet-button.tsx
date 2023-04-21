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

	async connectedCallback(){

		const wallet = await Web3WalletProvider.getWallet();
		await this.updateWalletConnectionState(wallet);

		Web3WalletProvider.registerWalletChangeListener(this.updateWalletConnectionState.bind(this));
	}

	async disconnectedCallback(){
		Web3WalletProvider.removeWalletChangeListener(this.updateWalletConnectionState.bind(this));
	}

	private async updateWalletConnectionState(wallet: WalletConnection){

		if (!wallet){
			this.walletInfo = null;
			return;
		}

		this.walletInfo = {...wallet, ...getWalletInfo(wallet.providerType)};
	}

	private formatWalletAddress(address: string){
		return address.substring(0, 4) + "..." + address.substring(address.length - 4);
	}

	render(){
		return (
			<button class={"btn wallet-connect-btn " + (this.walletInfo ? 'btn-secondary' : 'btn-primary')} onClick={async () => {

				if (this.walletInfo){
					await Web3WalletProvider.disconnectWallet();
				} else {
					await Web3WalletProvider.getWallet(true);
				}
			}}>
				{ this.walletInfo ? ([
					<div class="status-dot"></div>,
					<div title={this.walletInfo.providerType + ": " + this.walletInfo.address}>{this.formatWalletAddress(this.walletInfo.address)}</div>
				]) : 'Connect Wallet'}
			</button>
		)
	}
}

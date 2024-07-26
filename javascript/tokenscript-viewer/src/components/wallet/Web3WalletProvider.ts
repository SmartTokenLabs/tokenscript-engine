import {ethers} from 'ethers'
import {EIP1193Provider} from "@walletconnect/ethereum-provider/dist/types/types";
import {getWalletInfo, WALLET_LIST, WalletInfo} from "./WalletInfo";

declare global {
	interface Window {
		ethereum: any;
		okxwallet: any;
		gatewallet: any;
		foxwallet: any;
		klaytn: any;
		coin98: any;
	}
}

interface WalletConnectionState {
	[index: string]: WalletConnection
}

type SupportedBlockchainsParam = 'evm';

export interface WalletConnection {
	address: string
	chainId: number | string
	providerType: SupportedWalletProviders
	blockchain: SupportedBlockchainsParam
	provider?: ethers.BrowserProvider | any // solana(phantom) have different interface
	ethers?: any
}

export type SupportedWalletProviders = StaticProviders|`EIP6963_${string}`

export enum StaticProviders {
	MetaMask = 'MetaMask',
	CoinbaseSmartWallet = 'CoinbaseSmartWallet',
	WalletConnectV2 = 'WalletConnectV2',
	JoyID = 'JoyID',
	Torus = 'Torus',
}

interface EIP6963ProviderInfo {
	uuid: string;
	name: string;
	icon: string;
	rdns: string;
}

interface EIP6963ProviderDetail {
	info: EIP6963ProviderInfo;
	provider: EIP1193Provider;
}

interface EIP6963AnnounceProviderEvent extends CustomEvent {
	type: "eip6963:announceProvider";
	detail: EIP6963ProviderDetail;
}

export type WalletChangeListener = (walletConnection?: WalletConnection) => {};

class Web3WalletProviderObj {
	private static LOCAL_STORAGE_KEY = 'ts-wallet-connections'

	connections: WalletConnectionState = {}

	selectorCallback: () => Promise<SupportedWalletProviders>;

	walletChangeListeners: WalletChangeListener[] = [];

	injectedProviders: {[id: string]: EIP6963ProviderDetail} = {};

	constructor() {
		window.addEventListener(
			"eip6963:announceProvider",
			(event: EIP6963AnnounceProviderEvent) => {
				if (this.injectedProviders[event.detail.info.rdns])
					return;
				this.injectedProviders[event.detail.info.rdns] = event.detail;
				console.log("EIP-6963 wallet registered: ", event.detail.info.rdns)
			}
		);

		window.dispatchEvent(new Event("eip6963:requestProvider"));
	}

	getAvailableProviders(){

		const providers: WalletInfo[] = [];

		if (typeof window.ethereum !== 'undefined') {
			const providerInfo = getWalletInfo(StaticProviders.MetaMask);
			// Only include this wallet if it isn't already available via EIP6963
			if (!Object.values(this.injectedProviders).find((provider) => provider.info.name === providerInfo.label))
				providers.push(providerInfo);
		}

		for (const id in this.injectedProviders){
			const providerInfo = this.injectedProviders[id].info;

			providers.push(<WalletInfo>{
				id: `EIP6963_${id}`,
				label: providerInfo.name,
				icon: this.getReplacementIcon(providerInfo)
			});
		}

		providers.push(getWalletInfo(StaticProviders.WalletConnectV2));
		providers.push(getWalletInfo(StaticProviders.CoinbaseSmartWallet));
		providers.push(getWalletInfo(StaticProviders.JoyID));
		providers.push(getWalletInfo(StaticProviders.Torus));

		return providers;
	}

	getProviderInfo(id: SupportedWalletProviders): WalletInfo {

		if (id.indexOf("EIP6963_") === -1)
			return getWalletInfo(id);

		const [_tag, walletId] = id.split("_");

		const providerInfo = this.injectedProviders[walletId].info;

		return <WalletInfo>{
			id,
			label: providerInfo.name,
			icon: this.getReplacementIcon(providerInfo)
		}
	}

	private getReplacementIcon(providerInfo: EIP6963ProviderInfo){

		switch (providerInfo.rdns){
			case "com.brave.wallet":
				return WALLET_LIST.braveWallet.icon;
			case "io.gate.wallet":
				return WALLET_LIST.gateWallet.icon;
			default:
				return `<img alt="${providerInfo.name}" src="${providerInfo.icon}" />`;
		}
	}

	setWalletSelectorCallback(callback: () => Promise<SupportedWalletProviders>){
		this.selectorCallback = callback;
	}

	registerWalletChangeListener(listener: WalletChangeListener){
		this.walletChangeListeners.push(listener);
	}

	removeWalletChangeListener(listenerToRemove: WalletChangeListener) {
		for (const [index, listener] of this.walletChangeListeners.entries()){
			if (listener === listenerToRemove) {
				this.walletChangeListeners.slice(index, 1);
				break;
			}
		}
	}

	private emitWalletChangeEvent(connection?: WalletConnection){

		console.log("Wallet change event emitted!", connection);

		for (const listener of this.walletChangeListeners){
			listener(connection);
		}
	}

	isWalletConnected(){
		return this.getConnectedWalletData('evm').length > 0;
	}

	async getWallet(connect = false): Promise<WalletConnection> {

		if (this.getConnectedWalletData('evm').length === 0) {

			if (!connect)
				return null;

			return new Promise<WalletConnection>(async (resolve, reject) => {

				try {
					const providerName = await this.selectorCallback();

					await this.connectWith(providerName);

					resolve(this.getConnectedWalletData('evm')[0]);
				} catch (e){
					reject(e);
				}
			});
		}

		return this.getConnectedWalletData('evm')[0];
	}

	async disconnectWallet(){
		await this.deleteConnections();
		this.emitWalletChangeEvent();
	}

	async switchWallet(){

		return new Promise(async (resolve, reject) => {

			try {
				const providerName = await this.selectorCallback();

				await this.connectWith(providerName);

				resolve(this.getConnectedWalletData('evm')[0]);
			} catch (e){
				reject(e);
			}
		});
	}

	private saveConnections() {
		let savedConnections: WalletConnectionState = {}

		for (let address in this.connections) {
			let con = this.connections[address.toLowerCase()]

			savedConnections[address] = {
				address: con.address,
				chainId: con.chainId,
				providerType: con.providerType,
				blockchain: con.blockchain,
			}
		}

		localStorage.setItem(Web3WalletProviderObj.LOCAL_STORAGE_KEY, JSON.stringify(savedConnections))
	}

	private async deleteConnections() {
		if (window.ethereum?.removeAllListeners)
			window.ethereum.removeAllListeners();
		this.connections = {}

		let data = localStorage.getItem(Web3WalletProviderObj.LOCAL_STORAGE_KEY)
		if (data) {
			let state = JSON.parse(data)
			if (state) {
				for (let item in state) {
					let provider = state[item].providerType
					switch (provider) {

						case StaticProviders.WalletConnectV2:
							{
								let walletConnect2Provider = await import('./providers/WalletConnectV2Provider')

								let universalWalletConnect = await walletConnect2Provider.getWalletConnectV2ProviderInstance(true)

								if (universalWalletConnect.session) {
									universalWalletConnect
										.disconnect()
										// eslint-disable-next-line @typescript-eslint/no-empty-function
										.then(() => {})
										.catch((error) => {
											localStorage.removeItem('wc@2:client:0.3//session')
										})
								}
							}
							break

						case StaticProviders.CoinbaseSmartWallet:
							{
								const coinbaseProvider = await (await import('./providers/CoinbaseProvider')).getCoinbaseProviderInstance();
								await coinbaseProvider.disconnect();
							}
							break;

						default:
					}
				}
			}
		}

		localStorage.removeItem(Web3WalletProviderObj.LOCAL_STORAGE_KEY)
		sessionStorage.removeItem('CURRENT_USER')
	}

	async loadConnections() {
		let data = localStorage.getItem(Web3WalletProviderObj.LOCAL_STORAGE_KEY)

		if (!data) return

		let state = JSON.parse(data)

		if (!state) return

		for (let address in state) {
			let connection = state[address]

			try {
				await this.connectWith(connection.providerType, true)
			} catch (e) {
				delete state[address]
				this.saveConnections()
			}
		}
	}

	/**
	 *
	 * @param walletType a defined provider OR an EIP693 provider denoted using the format `EIP6963_${id}`
	 * @param checkConnectionOnly
	 */
	async connectWith(walletType: SupportedWalletProviders, checkConnectionOnly = false) {

		if (!walletType) throw new Error('Please provide a Wallet type to connect with.')

		try {
			if (!checkConnectionOnly) this.showLoader(true);

			let address;

			switch (walletType){
				case StaticProviders.MetaMask:
					address = await this.MetaMask();
					break;
				case StaticProviders.WalletConnectV2:
					address = await this.WalletConnectV2(checkConnectionOnly)
					break;
				case StaticProviders.CoinbaseSmartWallet:
					address = await this.CoinbaseSmartWallet();
					break;
				case StaticProviders.JoyID:
					address = await this.JoyID();
					break;
				case StaticProviders.Torus:
					address = await this.Torus();
					break;
				default:
					// Connect to EIP-6963 injected provider using the provided id (rdns value)
					if (walletType.indexOf("EIP6963_") === -1)
						throw new Error('Wallet type not found');

					address = await this.EIP6963(walletType);
			}

			if (!address) throw new Error("Wallet didn't connect")

			this.saveConnections()

			this.emitWalletChangeEvent(Object.values(this.connections)[0])

			this.showLoader(false);

			return address
		} catch (e) {
			this.showLoader(false);
			throw e;
		}
	}

	async signMessage(address: string, message: string) {
		let provider = this.getWalletProvider(address)
		let signer = provider.getSigner(address)
		return await signer.signMessage(message)
	}

	getConnectionByAddress(address: string) {
		return this.connections[address.toLowerCase()]
	}

	getWalletProvider(address: string) {
		address = address.toLowerCase()

		let connection = this.getConnectionByAddress(address)

		if (!connection) throw new Error('Connection not found for address')
		if (!connection.provider) throw new Error('Wallet provider not found for address')

		return connection.provider
	}

	getConnectedWalletData(blockchain: SupportedBlockchainsParam) {
		return Object.values(this.connections).filter((connection) => !connection?.blockchain || connection.blockchain === blockchain)
	}

	registerNewWalletAddress(
		address: string,
		chainId: number | string,
		providerType: SupportedWalletProviders,
		provider: ethers.BrowserProvider,
		blockchain: SupportedBlockchainsParam,
		eip1193Provider: any
	) {
		if (window.ethereum?.removeAllListeners)
			window.ethereum.removeAllListeners();
		this.connections = {};
		this.connections[address.toLowerCase()] = { address, chainId, providerType, provider, blockchain };

		eip1193Provider.on('accountsChanged', (accounts) => {

			if (Object.keys(this.connections).length === 0)
				return;

			if (!accounts || accounts.length === 0) {
				/**
				 * TODO do we need to disconnect all wallets?
				 * for now user cant connect to multiple wallets
				 * but do we need it for future?
				 */
				this.disconnectWallet()
				return
			}

			if (address === accounts[0]) return

			this.connections[accounts[0].toLowerCase()] = this.connections[address.toLowerCase()]

			address = accounts[0].toLowerCase();

			this.connections[address].address = address;

			this.saveConnections()

			this.emitWalletChangeEvent(Object.values(this.connections)[0])
		})

		eip1193Provider.on('chainChanged', (_chainId: any) => {
			this.connections[address.toLowerCase()].chainId = _chainId;

			this.saveConnections()

			//this.emitNetworkChange(_chainId)
		})

		eip1193Provider.on('disconnect', (reason: any) => {
			if (reason?.message && reason.message.indexOf('MetaMask: Disconnected from chain') > -1) return
			/**
			 * TODO do we need to disconnect all wallets?
			 * for now user cant connect to multiple wallets
			 * but do we need it for future?
			 */
			this.disconnectWallet();
		})
	}

	private async registerEvmProvider(provider: ethers.BrowserProvider, providerName: SupportedWalletProviders, injectedProvider: any) {
		const accounts = await provider.listAccounts()
		const chainId = (await provider.getNetwork()).chainId

		if (accounts.length === 0) {
			throw new Error('No accounts found via wallet-connect.')
		}

		let curAccount = accounts[0]

		this.registerNewWalletAddress(curAccount.address, parseInt(chainId.toString(10)), providerName, provider, 'evm', injectedProvider)

		return curAccount
	}

	async MetaMask() {

		if (typeof window.ethereum !== 'undefined') {
			await window.ethereum.enable()

			const provider = new ethers.BrowserProvider(window.ethereum, 'any')

			return this.registerEvmProvider(provider, StaticProviders.MetaMask, window.ethereum);
		} else {
			throw new Error('MetaMask is not available. Please check the extension is supported and active.')
		}
	}

	async EIP6963(id: `EIP6963_${string}`) {

		const [_tag, walletId] = id.split("_");

		if (!this.injectedProviders[walletId])
			throw new Error(`EIP6963 provider with rdns id ${walletId} not found`);

		// TODO: Temporary fix for coin98 EIP6963 not working, remove once fixed
		const injectedProvider = walletId !== "coin98.com" ? this.injectedProviders[walletId].provider : window.coin98.provider

		await injectedProvider.request({
			method: 'eth_requestAccounts',
		});

		const provider = new ethers.BrowserProvider(injectedProvider, 'any')

		return this.registerEvmProvider(provider, id, injectedProvider);
	}

	private showLoader(show: boolean){
		document.getElementsByTagName("app-root")[0].dispatchEvent(new CustomEvent(show ? "showLoader" : "hideLoader"));
	}

	async WalletConnectV2(checkConnectionOnly: boolean) {

		const walletConnectProvider = await import('./providers/WalletConnectV2Provider')

		const walletConnectV2 = await walletConnectProvider.getWalletConnectV2ProviderInstance(checkConnectionOnly)

		//let QRCodeModal

		/*walletConnectV2.on('display_uri', async (uri: string) => {
			QRCodeModal = new (await import('@walletconnect/modal')).WalletConnectModal({ projectId: "2ec7ead81da1226703ad789c0b2f7b30" });

			QRCodeModal.openModal(uri, () => {
				//this.client.getUi().showError('User closed modal')
			})
		})*/

		walletConnectV2.on('session_delete', ({ id, topic }: { id: number; topic: string }) => {
			// TODO: There is currently a bug in the universal provider that prevents this handler from being called.
			//  After this is fixed, this should handle the event correctly
			//  https://github.com/WalletConnect/walletconnect-monorepo/issues/1772
			this.disconnectWallet()
		})

		return new Promise((resolve, reject) => {
			if (checkConnectionOnly && !walletConnectV2.session) {
				reject('Not connected')
			} else {
				let connect

				if (walletConnectV2.session) {
					connect = walletConnectV2.enable()
				} else {
					// @ts-ignore
					connect = walletConnectV2.connect({
						chains: [1]
					})
				}

				connect
					.then(() => {
						//QRCodeModal?.close()
						const provider = new ethers.BrowserProvider(walletConnectV2, 'any')
						resolve(this.registerEvmProvider(provider, StaticProviders.WalletConnectV2, walletConnectV2))
					})
					.catch((e) => {
						//QRCodeModal?.close()
						reject(e)
					})
			}
		})
	}

	async Torus() {
		const TorusProvider = await import('./providers/TorusProvider')

		const torus = await TorusProvider.getTorusProviderInstance()

		await torus.init()

		await torus.login()

		const provider = new ethers.BrowserProvider(torus.provider, 'any')

		return this.registerEvmProvider(provider, StaticProviders.Torus, torus.provider)
	}

	async CoinbaseSmartWallet() {

		const coinbaseProvider = await (await import('./providers/CoinbaseProvider')).getCoinbaseProviderInstance();

		await coinbaseProvider.request({
			method: 'eth_requestAccounts',
		});

		const provider = new ethers.BrowserProvider(coinbaseProvider);

		return this.registerEvmProvider(provider, StaticProviders.CoinbaseSmartWallet, coinbaseProvider);
	}

	async JoyID() {

		const joyIdProvider = await (await import('./providers/JoyIDProvider')).getJoyIDProviderInstance() as unknown as EIP1193Provider;

		// @ts-ignore
		await joyIdProvider.request({
			method: 'eth_requestAccounts',
		});

		const provider = new ethers.BrowserProvider(joyIdProvider );

		return this.registerEvmProvider(provider, StaticProviders.JoyID, joyIdProvider);
	}
}

export const Web3WalletProvider = new Web3WalletProviderObj();

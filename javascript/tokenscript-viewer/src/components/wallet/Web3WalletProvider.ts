import { ethers } from 'ethers'

declare global {
	interface Window {
		ethereum: any;
		okxwallet: any;
	}
}

interface WalletConnectionState {
	[index: string]: WalletConnection
}

export interface WalletOptionsInterface {
	walletConnectV2?: {
		chains?: number[]
		rpcMap: { [chainId: string]: string }
	}
}

type SupportedBlockchainsParam = 'evm';

export interface WalletConnection {
	address: string
	chainId: number | string
	providerType: SupportedWalletProviders
	blockchain: SupportedBlockchainsParam
	provider?: ethers.providers.Web3Provider | any // solana(phantom) have different interface
	ethers?: any
}

export enum SupportedWalletProviders {
	MetaMask = 'MetaMask',
	WalletConnect = 'WalletConnect',
	WalletConnectV2 = 'WalletConnectV2',
	Torus = 'Torus',
}

export type WalletChangeListener = (walletConnection?: WalletConnection) => {};

class Web3WalletProviderObj {
	private static LOCAL_STORAGE_KEY = 'ts-wallet-connections'

	connections: WalletConnectionState = {}

	selectorCallback: () => Promise<SupportedWalletProviders>;

	walletChangeListeners: WalletChangeListener[] = [];

	constructor(private walletOptions?: WalletOptionsInterface) {}

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

	emitSavedConnection(address: string) {
		this.emitWalletChangeEvent(this.connections[address])
	}

	/*emitNetworkChange(chainId: string) {
		if (chainId) {
			this.client.eventSender('network-change', chainId)

			return chainId
		}
	}*/

	private async deleteConnections() {
		this.connections = {}

		let data = localStorage.getItem(Web3WalletProviderObj.LOCAL_STORAGE_KEY)
		if (data) {
			let state = JSON.parse(data)
			if (state) {
				for (let item in state) {
					let provider = state[item].providerType
					switch (provider) {
						/*case 'WalletConnect':
							{
								let walletConnectProvider = await import('./providers/WalletConnectProvider')
								let walletConnect = await walletConnectProvider.getWalletConnectProviderInstance(true)
								if (walletConnect?.wc?._connected) {
									walletConnect
										.disconnect()
										// eslint-disable-next-line @typescript-eslint/no-empty-function
										.then(() => {})
										.catch((error) => {
											localStorage.removeItem('walletconnect')
										})
								}
							}
							break*/

						case 'WalletConnectV2':
							{
								let walletConnect2Provider = await import('./providers/WalletConnectV2Provider')

								let universalWalletConnect = await walletConnect2Provider.getWalletConnectV2ProviderInstance()

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
				//this.emitSavedConnection(address)
			}
		}
	}

	async connectWith(walletType: string, checkConnectionOnly = false) {
		if (!walletType) throw new Error('Please provide a Wallet type to connect with.')

		if (!this[walletType as keyof Web3WalletProviderObj]) throw new Error('Wallet type not found')

		// @ts-ignore
		let address = await this[walletType as keyof Web3WalletProviderObj](checkConnectionOnly)

		if (!address) throw new Error("Wallet didn't connect")

		this.saveConnections()

		this.emitWalletChangeEvent(Object.values(this.connections)[0])

		return address
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
		return Object.values(this.connections).filter((connection) => connection.blockchain === blockchain)
	}

	registerNewWalletAddress(
		address: string,
		chainId: number | string,
		providerType: SupportedWalletProviders,
		provider: ethers.providers.Web3Provider,
		blockchain: SupportedBlockchainsParam,
	) {

		this.connections = {};
		this.connections[address.toLowerCase()] = { address, chainId, providerType, provider, blockchain, ethers }

		// @ts-ignore
		provider.provider.on('accountsChanged', (accounts) => {

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

			//this.client.getTokenStore().clearCachedTokens()
			//this.client.enrichTokenLookupDataOnChainTokens()
		})

		// @ts-ignore
		provider.provider.on('chainChanged', (_chainId: any) => {
			this.registerNewWalletAddress(address, _chainId, providerType, provider, 'evm')

			this.saveConnections()

			//this.emitNetworkChange(_chainId)
		})

		// @ts-ignore
		provider.provider.on('disconnect', (reason: any) => {
			if (reason?.message && reason.message.indexOf('MetaMask: Disconnected from chain') > -1) return
			/**
			 * TODO do we need to disconnect all wallets?
			 * for now user cant connect to multiple wallets
			 * but do we need it for future?
			 */
			this.disconnectWallet();
		})
	}

	private async registerEvmProvider(provider: ethers.providers.Web3Provider, providerName: SupportedWalletProviders) {
		const accounts = await provider.listAccounts()
		const chainId = (await provider.detectNetwork()).chainId

		if (accounts.length === 0) {
			throw new Error('No accounts found via wallet-connect.')
		}

		let curAccount = accounts[0]

		this.registerNewWalletAddress(curAccount, chainId, providerName, provider, 'evm')

		return curAccount
	}

	async MetaMask(checkConnectionOnly: boolean) {

		if (typeof window.ethereum !== 'undefined') {
			await window.ethereum.enable()

			const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')

			return this.registerEvmProvider(provider, SupportedWalletProviders.MetaMask)
		} else {
			throw new Error('MetaMask is not available. Please check the extension is supported and active.')
		}
	}

	/*async WalletConnect(checkConnectionOnly: boolean) {

		const walletConnectProvider = await import('./providers/WalletConnectProvider')

		const walletConnect = await walletConnectProvider.getWalletConnectProviderInstance(checkConnectionOnly)

		return new Promise((resolve, reject) => {
			if (checkConnectionOnly) {
				walletConnect.connector.on('display_uri', (err, payload) => {
					reject(new Error('Connection expired'))
				})
			}

			walletConnect
				.enable()
				.then(() => {
					const provider = new ethers.providers.Web3Provider(walletConnect, 'any')

					resolve(this.registerEvmProvider(provider, SupportedWalletProviders.WalletConnect))
				})
				.catch((e) => reject(e))
		})
	}*/

	async WalletConnectV2(checkConnectionOnly: boolean) {

		const walletConnectProvider = await import('./providers/WalletConnectV2Provider')

		const walletConnectV2 = await walletConnectProvider.getWalletConnectV2ProviderInstance()

		let QRCodeModal

		walletConnectV2.on('display_uri', async (uri: string) => {
			QRCodeModal = (await import('@walletconnect/qrcode-modal')).default

			QRCodeModal.open(uri, () => {
				//this.client.getUi().showError('User closed modal')
			})
		})

		walletConnectV2.on('session_delete', ({ id, topic }: { id: number; topic: string }) => {
			// TODO: There is currently a bug in the universal provider that prevents this handler from being called.
			//  After this is fixed, this should handle the event correctly
			//  https://github.com/WalletConnect/walletconnect-monorepo/issues/1772
			//this.client.disconnectWallet()
		})

		let preSavedWalletOptions = this.walletOptions

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
						chains: [1],
						optionalChains: preSavedWalletOptions?.walletConnectV2?.chains ?? walletConnectProvider.WC_V2_DEFAULT_CHAINS,
						rpcMap: preSavedWalletOptions?.walletConnectV2?.rpcMap ?? walletConnectProvider.WC_DEFAULT_RPC_MAP,
					})
				}

				connect
					.then(() => {
						QRCodeModal?.close()
						const provider = new ethers.providers.Web3Provider(walletConnectV2, 'any')
						resolve(this.registerEvmProvider(provider, SupportedWalletProviders.WalletConnectV2))
					})
					.catch((e) => {
						QRCodeModal?.close()
						reject(e)
					})
			}
		})
	}

	async Torus(checkConnectionOnly: boolean) {
		const TorusProvider = await import('./providers/TorusProvider')

		const torus = await TorusProvider.getTorusProviderInstance()

		await torus.init()

		await torus.login()

		const provider = new ethers.providers.Web3Provider(torus.provider, 'any')

		return this.registerEvmProvider(provider, SupportedWalletProviders.Torus)
	}
}

export const Web3WalletProvider = new Web3WalletProviderObj();

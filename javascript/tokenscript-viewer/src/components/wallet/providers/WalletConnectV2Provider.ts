import EthereumProvider from "@walletconnect/ethereum-provider";
import {CHAIN_CONFIG, CHAIN_MAP} from "../../../integration/constants";

export const WC_V2_DEFAULT_CHAINS = Object.keys(CHAIN_MAP).map(id => parseInt(id));
export const WC_V2_RPC_MAP = Object.entries(CHAIN_CONFIG).reduce((previousValue, [chainId, config]) => {
	previousValue[chainId] = typeof config.rpc === "string" ? config.rpc : config.rpc[0];
	return previousValue;
}, {});

export const getWalletConnectV2ProviderInstance = async (checkConnectionOnly: boolean) => {
	// @ts-ignore
	return await EthereumProvider.init({
		projectId: '2ec7ead81da1226703ad789c0b2f7b30',
		methods: ['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData', "wallet_addEthereumChain"],
		events: ['chainChanged', 'accountsChanged'],
		metadata: {
			name: "Smart Token Viewer",
			description: "TokenScript Viewer is an easy way to run TokenScripts in your browser if you don't have a TokenScript compatible wallet.",
			url: `${location.origin}`,
			icons: [`${location.origin}/assets/icon/icon.png`]
		},
		showQrModal: !checkConnectionOnly,
		optionalChains: WC_V2_DEFAULT_CHAINS,
		rpcMap: WC_V2_RPC_MAP
	});
}

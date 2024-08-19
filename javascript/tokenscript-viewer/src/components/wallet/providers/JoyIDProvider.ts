import { EthereumProvider, EvmConfig } from "@joyid/ethereum-provider";
import {WC_V2_DEFAULT_CHAINS} from "./WalletConnectV2Provider";
import {Chain} from "viem";
import {CHAIN_CONFIG, CHAIN_NAME_MAP} from "../../../integration/constants";

export const getJoyIDProviderInstance = async () => {

	const chainConfig: Chain[] = WC_V2_DEFAULT_CHAINS.map((chainId) => {

		const chainData = CHAIN_CONFIG[chainId];

		return <Chain>{
			id: chainId,
			name: CHAIN_NAME_MAP[chainId],
			nativeCurrency: {
				name: "Ethereum",
				symbol: "ETH",
				decimals: 18
			},
			rpcUrls: {
				default: {
					http: typeof chainData.rpc === "string" ? [chainData.rpc] : chainData.rpc
				}
			},
			blockExplorers: chainData.explorer ? {
				default: {
					name: "Default explorer",
					url: chainData.explorer,
					apiUrl: ""
				}
			} : null,
		}
	});

	return new EthereumProvider(chainConfig, {
		name: "Smart Token Viewer",
		logo: `${location.origin}/assets/icon/icon.png`,
		joyidAppURL: "https://app.joy.id",
	});
};

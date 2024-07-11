import {CoinbaseWalletSDK} from "@coinbase/wallet-sdk";
import {WC_V2_DEFAULT_CHAINS} from "./WalletConnectV2Provider";

export const getCoinbaseProviderInstance = async () => {

	const smartWalletSdk = new CoinbaseWalletSDK({
		appLogoUrl: "/",
		appName: 'Charity',
		appChainIds: WC_V2_DEFAULT_CHAINS
	});

	return smartWalletSdk.makeWeb3Provider();
}

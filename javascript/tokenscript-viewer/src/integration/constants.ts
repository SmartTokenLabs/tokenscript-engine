import {IChainConfig} from "@tokenscript/engine-js/src/wallet/EthersAdapter";

export interface ChainMapInterface {
	[key: number]: string;
}

enum ChainID {
	ETHEREUM = 1,
	POLYGON = 137,
	ARBITRUM = 42161,
	OPTIMISM = 10,
	BSC = 56,
	BSC_TESTNET = 97,
	GOERLI = 5,
	SEPOLIA = 11155111,
	KOVAN = 42,
	MUMBAI = 80001,
	AVALANCH = 43114,
	FANTOM = 250,
	KLAYTN = 8217,
	BAOBAB = 1001
}

export const CHAIN_MAP: ChainMapInterface = {
	[ChainID.ETHEREUM]: "eth",
	[ChainID.POLYGON]: "polygon",
	[ChainID.ARBITRUM]: "arbitrum",
	[ChainID.OPTIMISM]: "optimism",
	[ChainID.GOERLI]: "goerli",
	[ChainID.SEPOLIA]: "sepolia",
	[ChainID.KOVAN]: "kovan",
	[ChainID.BSC]: "bsc",
	[ChainID.MUMBAI]: "mumbai",
	[ChainID.AVALANCH]: "avalanche",
	[ChainID.FANTOM]: "fantom",
	[ChainID.KLAYTN]: "cypress",
	[ChainID.BAOBAB]: "baobab",
};

export const CHAIN_NAME_MAP: ChainMapInterface = {
	[ChainID.ETHEREUM]: "Ethereum Mainnet",
	[ChainID.GOERLI]: "Goerli (Ethereum Testnet)",
	[ChainID.SEPOLIA]: "Sepolia (Ethereum Testnet)",
	[ChainID.POLYGON]: "Polygon",
	[ChainID.MUMBAI]: "Mumbai (Polygon Testnet)",
	[ChainID.ARBITRUM]: "Arbitrum",
	[ChainID.OPTIMISM]: "Optimism",
	[ChainID.BSC]: "Binance Smart Chain",
	[ChainID.AVALANCH]: "Avalanche",
	[ChainID.FANTOM]: "Fantom",
	[ChainID.KLAYTN]: "Cypress (Klaytn Mainnet)",
	[ChainID.BAOBAB]: "Baobab (Klaytn Testnet)",
};

export const CHAIN_CONFIG: {[chain: number]: IChainConfig} = {
	[ChainID.ETHEREUM]: {
		rpc: 'https://eth-mainnet.g.alchemy.com/v2/2bJxn0VGXp9U5EOfA6CoMGU-rrd-BIIT',
		explorer: 'https://etherscan.com/tx/'
	},
	[ChainID.GOERLI]: {
		rpc: 'https://eth-goerli.g.alchemy.com/v2/yVhq9zPJorAWsw-F87fEabSUl7cCU6z4',
		explorer: 'https://goerli.etherscan.io/tx/'
	},
	[ChainID.SEPOLIA]: {
		rpc: 'https://sepolia.infura.io/v3/9f79b2f9274344af90b8d4e244b580ef',
		explorer: 'https://sepolia.etherscan.io/tx/'
	},
	[ChainID.POLYGON]: {
		rpc: 'https://polygon-rpc.com/',
		explorer: 'https://polygonscan.com/tx/'
	},
	[ChainID.MUMBAI]: {
		rpc: 'https://polygon-mumbai.g.alchemy.com/v2/rVI6pOV4irVsrw20cJxc1fxK_1cSeiY0',
		explorer: 'https://mumbai.polygonscan.com/tx/'
	},
	[ChainID.BSC]: {
		rpc: 'https://bsc-dataseed.binance.org/',
		explorer: 'https://bscscan.com/tx/'
	},
	[ChainID.BSC_TESTNET]: {
		rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545',
		explorer: 'https://testnet.bscscan.com/tx/'
	},
	[ChainID.AVALANCH]: {
		rpc: 'https://api.avax.network/ext/bc/C/rpc',
		explorer: 'https://cchain.explorer.avax.network/tx/'
	},
	[ChainID.FANTOM]: {
		rpc: 'https://rpc.fantom.network/',
		explorer: 'https://ftmscan.com/tx/'
	},
	[ChainID.ARBITRUM]: {
		rpc: 'https://arb1.arbitrum.io/rpc',
		explorer: 'https://arbiscan.io/tx/'
	},
	//421613: 'https://arb-goerli.g.alchemy.com/v2/nFrflomLgsQQL5NWjGileAVqIGGxZWce', // Arbitrum goerli,
	[ChainID.OPTIMISM]: {
		rpc: 'https://mainnet.optimism.io',
		explorer: 'https://optimistic.etherscan.io/tx/'
	},
	[ChainID.KLAYTN]: {
		rpc: 'https://public-node-api.klaytnapi.com/v1/cypress',
		explorer: 'https://scope.klaytn.com/tx/'
	},
	[ChainID.BAOBAB]: {
		rpc: 'https://public-node-api.klaytnapi.com/v1/baobab',
		explorer: 'https://baobab.scope.klaytn.com/tx/'
	}
	//43113: 'https://api.avax-test.network/ext/bc/C/rpc', // Fuji testnet
	/*25: {
		rpc: 'https://evm-cronos.crypto.org',
		explorer: ''
	},
	338: {
		rpc: 'https://evm-t3.cronos.org',
		explorer: ''
	},*/
}

import {IChainConfig} from "@tokenscript/engine-js/src/wallet/EthersAdapter";
import {Env} from "@stencil/core";

export interface ChainMapInterface {
	[key: number]: string;
}

export enum ChainID {
	ETHEREUM = 1,
	POLYGON = 137,
	ARBITRUM = 42161,
	OPTIMISM = 10,
	BSC = 56,
	BSC_TESTNET = 97,
	SEPOLIA = 11155111,
	HOLESKY = 17000,
	KOVAN = 42,
	AMOY = 80002,
	AVALANCH = 43114,
	FANTOM = 250,
	KAIA = 8217,
	KAIA_KAIROS = 1001,
	HARDHAT_LOCALHOST = 31337,
	MANTLE = 5000,
	MANTLE_SEPOLIA = 5003,
	BASE = 8453,
	BASE_SEPOLIA= 84532,
	BLAST = 81457,
	BLAST_SEPOLIA = 168587773,
	MINT = 185,
	MINT_SEPOLIA = 1687,
	CELO = 42220,
	CELO_ALFAJORES = 44787,
	RISE_SEPOLIA = 11155931,
	OP_BNB = 204,
	OP_BNB_TESTNET = 5611,
	LINEA = 59144,
	POLYGON_ZKEVM = 1101,
	ZKSYNC = 324,
	SCROLL = 534352,
}

export const CHAIN_MAP: ChainMapInterface = {
	[ChainID.ETHEREUM]: "eth",
	[ChainID.POLYGON]: "polygon",
	[ChainID.ARBITRUM]: "arbitrum",
	[ChainID.OPTIMISM]: "optimism",
	[ChainID.SEPOLIA]: "sepolia",
	[ChainID.HOLESKY]: 'holesky',
	//[ChainID.KOVAN]: "kovan",
	[ChainID.BSC]: "bsc",
	[ChainID.BSC_TESTNET]: "bsct",
	[ChainID.AMOY]: "amoy",
	[ChainID.AVALANCH]: "avalanche",
	[ChainID.FANTOM]: "fantom",
	[ChainID.KAIA]: "cypress",
	[ChainID.KAIA_KAIROS]: "baobab",
	[ChainID.HARDHAT_LOCALHOST]: "hardhat-localhost",
	[ChainID.MANTLE]: "mantle",
	[ChainID.MANTLE_SEPOLIA]: "mantle-sepolia",
	[ChainID.BASE]: "base",
	[ChainID.BASE_SEPOLIA]: "base-sepolia",
	[ChainID.BLAST]: 'blast',
	[ChainID.BLAST_SEPOLIA]: 'blast-sepolia',
	[ChainID.MINT]: 'mint',
	[ChainID.MINT_SEPOLIA]: 'mint-sepolia',
	[ChainID.CELO]: 'celo',
	[ChainID.CELO_ALFAJORES]: 'celo-alfajores',
	[ChainID.RISE_SEPOLIA]: 'rise-sepolia',
	[ChainID.OP_BNB]: "obnb",
	[ChainID.OP_BNB_TESTNET]: "obnbt",
	[ChainID.LINEA]: "linea",
	[ChainID.POLYGON_ZKEVM]: "zkevm",
	[ChainID.ZKSYNC]: "zksync",
	[ChainID.SCROLL]: "scr",
};

export const CHAIN_NAME_MAP: ChainMapInterface = {
	[ChainID.ETHEREUM]: "Ethereum Mainnet",
	[ChainID.SEPOLIA]: "Sepolia (Ethereum Testnet)",
	[ChainID.HOLESKY]: 'Holesky (Ethereum Testnet)',
	[ChainID.POLYGON]: "Polygon",
	[ChainID.AMOY]: "Amoy (Polygon Testnet)",
	[ChainID.ARBITRUM]: "Arbitrum",
	[ChainID.OPTIMISM]: "Optimism",
	[ChainID.BSC]: "Binance Smart Chain",
	[ChainID.BSC_TESTNET]: "Binance Smart Chain Testnet",
	[ChainID.AVALANCH]: "Avalanche",
	[ChainID.FANTOM]: "Fantom",
	[ChainID.KAIA]: "Kaia",
	[ChainID.KAIA_KAIROS]: "Kairos (Kaia Testnet)",
	[ChainID.HARDHAT_LOCALHOST]: "Hardhat Localhost (EVM Test Network)",
	[ChainID.MANTLE]: "Mantle",
	[ChainID.MANTLE_SEPOLIA]: "Mantle (Sepolia Testnet)",
	[ChainID.BASE]: "Base",
	[ChainID.BASE_SEPOLIA]: "Base (Sepolia Testnet)",
	[ChainID.BLAST]: 'Blast',
	[ChainID.BLAST_SEPOLIA]: 'Blast (Sepolia Testnet)',
	[ChainID.MINT]: 'Mint',
	[ChainID.MINT_SEPOLIA]: 'Mint (Sepolia Testnet)',
	[ChainID.CELO]: 'Celo',
	[ChainID.CELO_ALFAJORES]: 'Celo (Alfajores Testnet)',
	[ChainID.RISE_SEPOLIA]: 'Rise (Sepolia Testnet)',
	[ChainID.OP_BNB]: "opBNB",
	[ChainID.OP_BNB_TESTNET]: "opBNB Testnet",
	[ChainID.LINEA]: "Linea",
	[ChainID.POLYGON_ZKEVM]: "Polygon zkEVM",
	[ChainID.ZKSYNC]: "zkSync",
	[ChainID.SCROLL]: "Scroll",
};

const INFURA_API_KEY = Env.INFURA_API_KEY ?? "9f79b2f9274344af90b8d4e244b580ef"

export const CHAIN_EAS_SCHEMA_REGI_MAP: ChainMapInterface = {
  [ChainID.ETHEREUM]: '0xA7b39296258348C78294F95B872b282326A97BDF',
  [ChainID.SEPOLIA]: '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0',
  [ChainID.POLYGON]: '0x7876EEF51A891E737AF8ba5A5E0f0Fd29073D5a7',
  // TODO: Add amoy and other chains
};

export const CHAIN_CONFIG: {[chain: number]: IChainConfig} = {
	[ChainID.ETHEREUM]: {
		rpc: [
			`https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
			'https://1rpc.io/eth',
			'https://eth.llamarpc.com',
			'https://api.mycryptoapi.com/eth',
			'https://cloudflare-eth.com',
			'https://ethereum-rpc.publicnode.com',
			'https://mainnet.gateway.tenderly.co',
			'https://rpc.blocknative.com/boost',
			'https://rpc.flashbots.net',
			'https://rpc.flashbots.net/fast',
			'https://rpc.mevblocker.io',
			'https://rpc.mevblocker.io/fast',
			'https://rpc.mevblocker.io/noreverts',
			'https://rpc.mevblocker.io/fullprivacy',
			'https://eth.drpc.org',
		],
		explorer: 'https://etherscan.com/tx/'
	},
	[ChainID.SEPOLIA]: {
		rpc: [
			`https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
			"https://eth-sepolia.api.onfinality.io/public",
			"https://rpc.sepolia.org"
		],
		explorer: 'https://sepolia.etherscan.io/tx/'
	},
	[ChainID.HOLESKY]: {
		rpc: `https://holesky.infura.io/v3/${INFURA_API_KEY}`,
		explorer: 'https://holesky.etherscan.io/tx/'
	},
	[ChainID.POLYGON]: {
		rpc: [
			`https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
			"https://polygon-rpc.com/",
			"https://rpc-mainnet.matic.quiknode.pro",
			/*"https://polygon-bor.publicnode.com",
			"https://polygon.gateway.tenderly.co"*/
		],
		explorer: 'https://polygonscan.com/tx/'
	},
	[ChainID.AMOY]: {
		rpc: `https://polygon-amoy.infura.io/v3/${INFURA_API_KEY}`,
		explorer: 'https://amoy.polygonscan.com/tx/'
	},
	[ChainID.BSC]: {
		rpc: [
			'https://bsc-dataseed.binance.org/',
			'https://bsc-dataseed1.bnbchain.org',
			'https://bsc-dataseed2.bnbchain.org',
			'https://bsc-dataseed3.bnbchain.org',
			'https://bsc-dataseed4.bnbchain.org',
			'https://bsc-dataseed1.defibit.io',
			'https://bsc-dataseed2.defibit.io',
			'https://bsc-dataseed3.defibit.io',
			'https://bsc-dataseed4.defibit.io',
			'https://bsc-dataseed1.ninicoin.io',
			'https://bsc-dataseed2.ninicoin.io',
			'https://bsc-dataseed3.ninicoin.io',
			'https://bsc-dataseed4.ninicoin.io',
			'https://bsc-rpc.publicnode.com',
		],
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
		rpc: [
			'https://arb1.arbitrum.io/rpc',
			`https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}`,
			`https://arbitrum-one.publicnode.com`,
		],
		explorer: 'https://arbiscan.io/tx/'
	},
	[ChainID.OPTIMISM]: {
		rpc: [
			'https://mainnet.optimism.io',
			"https://optimism-rpc.publicnode.com",
			"https://optimism.gateway.tenderly.co",
			"https://optimism.drpc.org",
		],
		explorer: 'https://optimistic.etherscan.io/tx/'
	},
	[ChainID.KAIA]: {
		rpc: [
			'https://alpha-hardworking-orb.kaia-mainnet.quiknode.pro/',
			'https://kaia.blockpi.network/v1/rpc/public',
			// 'http://freely-inspired-ram.n0des.xyz', // archive
			'https://klaytn.api.onfinality.io/public',
			'https://kaia-mainnet.rpc.grove.city/v1/803ceedf',
			'https://go.getblock.io/d7094dbd80ab474ba7042603fe912332	',
			'https://rpc.ankr.com/klaytn',
			'https://klaytn-pokt.nodies.app',
			'https://1rpc.io/klay',
			'https://public-en.node.kaia.io',
		],
		explorer: 'https://kaiascope.com/tx/',
	},
	[ChainID.KAIA_KAIROS]: {
		rpc: [
			'https://responsive-green-emerald.kaia-kairos.quiknode.pro/',
			'https://rpc.ankr.com/klaytn_testnet',
			'https://kaia-kairos.blockpi.network/v1/rpc/public',
			'https://public-en.kairos.node.kaia.io',
		],
		explorer: 'https://kairos.kaiascope.com/tx/',
	},
	[ChainID.HARDHAT_LOCALHOST]: {
		rpc: 'http://127.0.0.1:8545/',
		explorer: ''
	},
	[ChainID.MANTLE]: {
		rpc: 'https://rpc.mantle.xyz',
		explorer: 'https://explorer.mantle.xyz/tx/'
	},
	[ChainID.MANTLE_SEPOLIA]: {
		rpc: 'https://rpc.sepolia.mantle.xyz',
		explorer: 'https://explorer.sepolia.mantle.xyz/tx/'
	},
	[ChainID.BASE]: {
		rpc: [
			`https://base-mainnet.infura.io/v3/${INFURA_API_KEY}`,
			"https://base.llamarpc.com",
			"https://base.drpc.org"
		],
		explorer: 'https://basescan.org/tx/'
	},
	[ChainID.BASE_SEPOLIA]: {
		rpc: [
			`https://base-sepolia.infura.io/v3/${INFURA_API_KEY}`,
			"https://sepolia.base.org",
			"https://base-sepolia-rpc.publicnode.com"
		],
		explorer: 'https://sepolia.basescan.org/tx/'
	},
	[ChainID.BLAST]: {
		rpc: `https://blast-mainnet.infura.io/v3/${INFURA_API_KEY}`,
		explorer: 'https://basescan.org/tx/',
	},
	[ChainID.BLAST_SEPOLIA]: {
		rpc: `https://blast-sepolia.infura.io/v3/${INFURA_API_KEY}`,
		explorer: 'https://sepolia.basescan.org/tx/',
	},
	[ChainID.MINT]: {
		rpc: [
			'https://rpc.mintchain.io',
			'https://asia.rpc.mintchain.io',
			'https://global.rpc.mintchain.io'
		],
		explorer: 'https://explorer.mintchain.io/tx/',
	},
	[ChainID.MINT_SEPOLIA]: {
		rpc: `https://sepolia-testnet-rpc.mintchain.io`,
		explorer: 'https://sepolia-testnet-explorer.mintchain.io/tx/',
	},
	[ChainID.CELO]: {
		rpc: `https://celo-mainnet.infura.io/v3/${INFURA_API_KEY}`,
		explorer: 'https://explorer.celo.org/mainnet/tx/',
	},
	[ChainID.CELO_ALFAJORES]: {
		rpc: `https://celo-alfajores.infura.io/v3/${INFURA_API_KEY}`,
		explorer: 'https://explorer.celo.org/alfajores/tx/',
	},
	[ChainID.RISE_SEPOLIA]: {
		rpc: 'https://testnet.riselabs.xyz',
		explorer: 'https://testnet-explorer.riselabs.xyz/tx/',
	},
	[ChainID.OP_BNB]: {
		rpc: [
			'https://opbnb-mainnet-rpc.bnbchain.org',
			'https://opbnb-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3',
			'https://opbnb-mainnet.nodereal.io/v1/e9a36765eb8a40b9bd12e680a1fd2bc5',
			'https://opbnb-rpc.publicnode.com',
			'https://opbnb.drpc.org',
			],
		explorer: 'https://opbnb.bscscan.com/tx/'
	},
	[ChainID.OP_BNB_TESTNET]: {
		rpc: [
			'https://opbnb-testnet-rpc.bnbchain.org',
			'https://opbnb-testnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3',
			'https://opbnb-testnet.nodereal.io/v1/e9a36765eb8a40b9bd12e680a1fd2bc5',
			'https://opbnb-testnet-rpc.publicnode.com',
		],
		explorer: 'https://opbnb-testnet.bscscan.com/tx/'
	},
	[ChainID.LINEA]: {
		rpc: [
			'https://rpc.linea.build',
			`https://linea-mainnet.infura.io/v3/${INFURA_API_KEY}`,
			'https://linea-rpc.publicnode.com',
		],
		explorer: 'https://lineascan.build/tx/'
	},
	[ChainID.POLYGON_ZKEVM]: {
		rpc: [
			'https://zkevm-rpc.com',
      		'https://polygon-zkevm.drpc.org'
		],
		explorer: 'https://zkevm.polygonscan.com/tx/'
	},
	[ChainID.ZKSYNC]: {
		rpc: [
			'https://mainnet.era.zksync.io',
      		'https://zksync.drpc.org'
		],
		explorer: 'https://explorer.zksync.io/tx/'
	},
	[ChainID.SCROLL]: {
		rpc: [
			'https://rpc.scroll.io',
			'https://rpc.ankr.com/scroll',
			'https://scroll-mainnet.chainstacklabs.com',
			'https://scroll-rpc.publicnode.com'
		],
		explorer: 'https://scrollscan.com/tx/'
	},
}

export const ERC721_ABI_JSON = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "approved",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			}
		],
		"name": "ApprovalForAll",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_fromTokenId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_toTokenId",
				"type": "uint256"
			}
		],
		"name": "BatchMetadataUpdate",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_tokenId",
				"type": "uint256"
			}
		],
		"name": "MetadataUpdate",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "getApproved",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			}
		],
		"name": "isApprovedForAll",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ownerOf",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "uri",
				"type": "string"
			}
		],
		"name": "safeMint",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "safeTransferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			}
		],
		"name": "safeTransferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			}
		],
		"name": "setApprovalForAll",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes4",
				"name": "interfaceId",
				"type": "bytes4"
			}
		],
		"name": "supportsInterface",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "index",
				"type": "uint256"
			}
		],
		"name": "tokenByIndex",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "index",
				"type": "uint256"
			}
		],
		"name": "tokenOfOwnerByIndex",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "contractURI",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "tokenURI",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

export const ERC20_ABI_JSON = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "ECDSAInvalidSignature",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "length",
				"type": "uint256"
			}
		],
		"name": "ECDSAInvalidSignatureLength",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "s",
				"type": "bytes32"
			}
		],
		"name": "ECDSAInvalidSignatureS",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "allowance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientAllowance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "balance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "approver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidApprover",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidReceiver",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSender",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSpender",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "deadline",
				"type": "uint256"
			}
		],
		"name": "ERC2612ExpiredSignature",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "signer",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "ERC2612InvalidSigner",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "EnforcedPause",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ExpectedPause",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "currentNonce",
				"type": "uint256"
			}
		],
		"name": "InvalidAccountNonce",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidInitialization",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotInitializing",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "EIP712DomainChanged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint64",
				"name": "version",
				"type": "uint64"
			}
		],
		"name": "Initialized",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "Paused",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "Unpaused",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "DOMAIN_SEPARATOR",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "burn",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "burnFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "burnFromSmartCat",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "eip712Domain",
		"outputs": [
			{
				"internalType": "bytes1",
				"name": "fields",
				"type": "bytes1"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "version",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "chainId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "verifyingContract",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "salt",
				"type": "bytes32"
			},
			{
				"internalType": "uint256[]",
				"name": "extensions",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_smartCatContract",
				"type": "address"
			}
		],
		"name": "initialize",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "mint",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "mintFromSmartCat",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "nonces",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "pause",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "paused",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "deadline",
				"type": "uint256"
			},
			{
				"internalType": "uint8",
				"name": "v",
				"type": "uint8"
			},
			{
				"internalType": "bytes32",
				"name": "r",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "s",
				"type": "bytes32"
			}
		],
		"name": "permit",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_smartCatContract",
				"type": "address"
			}
		],
		"name": "setSmartCatContract",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "unpause",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "contractURI",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "pure",
		"type": "function"
	},
];

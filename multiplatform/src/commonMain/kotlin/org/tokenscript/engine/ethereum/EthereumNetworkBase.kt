package org.tokenscript.engine.ethereum

/* Weiwu 12 Jan 2020: This class eventually will replace the EthereumNetworkBase class in :app
 * one all interface methods are implemented.
 */
object EthereumNetworkBase {
    // implements EthereumNetworkRepositoryType
    const val MAINNET_ID: Long = 1
    const val CLASSIC_ID: Long = 61
    const val POA_ID: Long = 99
    const val KOVAN_ID: Long = 42
    const val ROPSTEN_ID: Long = 3
    const val SOKOL_ID: Long = 77
    const val RINKEBY_ID: Long = 4
    const val XDAI_ID: Long = 100
    const val GOERLI_ID: Long = 5
    const val ARTIS_SIGMA1_ID: Long = 246529
    const val ARTIS_TAU1_ID: Long = 246785
    const val BINANCE_TEST_ID: Long = 97
    const val BINANCE_MAIN_ID: Long = 56
    const val HECO_ID: Long = 128
    const val HECO_TEST_ID: Long = 256
    const val FANTOM_ID: Long = 250
    const val FANTOM_TEST_ID: Long = 4002
    const val AVALANCHE_ID: Long = 43114
    const val FUJI_TEST_ID: Long = 43113
    const val MATIC_ID: Long = 137
    const val MATIC_TEST_ID: Long = 80001
    const val OPTIMISTIC_MAIN_ID: Long = 10
    const val OPTIMISTIC_TEST_ID: Long = 69
    const val CRONOS_TEST_ID: Long = 338
    const val ARBITRUM_MAIN_ID: Long = 42161
    const val ARBITRUM_TEST_ID: Long = 421611
    const val PALM_ID = 0x2a15c308dL //11297108109
    const val PALM_TEST_ID = 0x2a15c3083L //11297108099
    const val KLAYTN_ID: Long = 8217
    const val KLAYTN_BOABAB_ID: Long = 1001
    const val IOTEX_MAINNET_ID: Long = 4689
    const val IOTEX_TESTNET_ID: Long = 4690
    const val AURORA_MAINNET_ID: Long = 1313161554
    const val AURORA_TESTNET_ID: Long = 1313161555
    const val MILKOMEDA_C1_ID: Long = 2001
    const val MILKOMEDA_C1_TEST_ID: Long = 200101
    const val MAINNET_RPC_URL = "https://mainnet.infura.io/v3/da3717f25f824cc1baa32d812386d93f"
    const val CLASSIC_RPC_URL = "https://www.ethercluster.com/etc"
    const val XDAI_RPC_URL = "https://rpc.xdaichain.com"
    const val POA_RPC_URL = "https://core.poa.network/"
    const val ROPSTEN_RPC_URL = "https://ropsten.infura.io/v3/da3717f25f824cc1baa32d812386d93f"
    const val RINKEBY_RPC_URL = "https://rinkeby.infura.io/v3/da3717f25f824cc1baa32d812386d93f"
    const val KOVAN_RPC_URL = "https://kovan.infura.io/v3/da3717f25f824cc1baa32d812386d93f"
    const val SOKOL_RPC_URL = "https://sokol.poa.network"
    const val GOERLI_RPC_URL = "https://goerli.infura.io/v3/da3717f25f824cc1baa32d812386d93f"
    const val ARTIS_SIGMA1_RPC_URL = "https://rpc.sigma1.artis.network"
    const val ARTIS_TAU1_RPC_URL = "https://rpc.tau1.artis.network"
    const val BINANCE_TEST_RPC_URL = "https://data-seed-prebsc-1-s3.binance.org:8545"
    const val BINANCE_MAIN_RPC_URL = "https://bsc-dataseed.binance.org"
    const val HECO_RPC_URL = "https://http-mainnet-node.huobichain.com"
    const val HECO_TEST_RPC_URL = "https://http-testnet.hecochain.com"
    const val AVALANCHE_RPC_URL = "https://api.avax.network/ext/bc/C/rpc"
    const val FUJI_TEST_RPC_URL = "https://api.avax-test.network/ext/bc/C/rpc"
    const val FANTOM_RPC_URL = "https://rpcapi.fantom.network"
    const val FANTOM_TEST_RPC_URL = "https://rpc.testnet.fantom.network"
    const val MATIC_RPC_URL = "https://matic-mainnet.chainstacklabs.com"
    const val MUMBAI_TEST_RPC_URL = "https://matic-mumbai.chainstacklabs.com"
    const val OPTIMISTIC_MAIN_URL = "https://mainnet.optimism.io"
    const val OPTIMISTIC_TEST_URL = "https://kovan.optimism.io"
    const val CRONOS_TEST_URL = "http://cronos-testnet.crypto.org:8545"
    const val ARBITRUM_RPC_URL = "https://arbitrum-mainnet.infura.io/v3/da3717f25f824cc1baa32d812386d93f"
    const val ARBITRUM_TEST_RPC_URL = "https://arbitrum-rinkeby.infura.io/v3/da3717f25f824cc1baa32d812386d93f"
    const val PALM_RPC_URL = "https://palm-mainnet.infura.io/v3/da3717f25f824cc1baa32d812386d93f"
    const val PALM_TEST_RPC_URL = "https://palm-testnet.infura.io/v3/da3717f25f824cc1baa32d812386d93f"
    const val KLAYTN_RPC = "https://public-node-api.klaytnapi.com/v1/cypress"
    const val KLAYTN_BAOBAB_RPC = "https://api.baobab.klaytn.net:8651"
    const val AURORA_MAINNET_RPC_URL = "https://mainnet.aurora.dev"
    const val AURORA_TESTNET_RPC_URL = "https://testnet.aurora.dev"
    const val MILKOMEDA_C1_RPC = "https://rpc-mainnet-cardano-evm.c1.milkomeda.com"
    const val MILKOMEDA_C1_TEST_RPC = "https://rpc-devnet-cardano-evm.c1.milkomeda.com"
    
    val networkMap: LinkedHashMap<Long, org.tokenscript.engine.ethereum.NetworkInfo> = LinkedHashMap()

    init {
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.MAINNET_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Ethereum",
                "ETH",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.MAINNET_RPC_URL,
                "https://etherscan.io/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.MAINNET_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.CLASSIC_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Ethereum Classic",
                "ETC",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.CLASSIC_RPC_URL,
                "https://blockscout.com/etc/mainnet/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.CLASSIC_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.XDAI_ID, org.tokenscript.engine.ethereum.NetworkInfo(
                "Gnosis",
                "xDAi",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.XDAI_RPC_URL,
                "https://blockscout.com/xdai/mainnet/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.XDAI_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.POA_ID, org.tokenscript.engine.ethereum.NetworkInfo(
                "POA",
                "POA",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.POA_RPC_URL,
                "https://blockscout.com/poa/core/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.POA_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.ARTIS_SIGMA1_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "ARTIS sigma1",
                "ATS",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.ARTIS_SIGMA1_RPC_URL,
                "https://explorer.sigma1.artis.network/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.ARTIS_SIGMA1_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.KOVAN_ID, org.tokenscript.engine.ethereum.NetworkInfo(
                "Kovan (Test)",
                "ETH",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.KOVAN_RPC_URL,
                "https://kovan.etherscan.io/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.KOVAN_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.ROPSTEN_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Ropsten (Test)",
                "ETH",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.ROPSTEN_RPC_URL,
                "https://ropsten.etherscan.io/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.ROPSTEN_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.SOKOL_ID, org.tokenscript.engine.ethereum.NetworkInfo(
                "Sokol (Test)",
                "POA",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.SOKOL_RPC_URL,
                "https://blockscout.com/poa/sokol/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.SOKOL_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.RINKEBY_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Rinkeby (Test)",
                "ETH",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.RINKEBY_RPC_URL,
                "https://rinkeby.etherscan.io/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.RINKEBY_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.GOERLI_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Görli (Test)",
                "GÖETH",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.GOERLI_RPC_URL,
                "https://goerli.etherscan.io/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.GOERLI_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.ARTIS_TAU1_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "ARTIS tau1 (Test)",
                "ATS",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.ARTIS_TAU1_RPC_URL,
                "https://explorer.tau1.artis.network/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.ARTIS_TAU1_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.BINANCE_TEST_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "BSC TestNet (Test)",
                "T-BSC",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.BINANCE_TEST_RPC_URL,
                "https://explorer.binance.org/smart-testnet/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.BINANCE_MAIN_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.BINANCE_MAIN_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Binance (BSC)",
                "BSC",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.BINANCE_MAIN_RPC_URL,
                "https://explorer.binance.org/smart/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.BINANCE_TEST_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.HECO_ID, org.tokenscript.engine.ethereum.NetworkInfo(
                "Heco",
                "HT",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.HECO_RPC_URL,
                "https://hecoinfo.com/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.HECO_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.HECO_TEST_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Heco (Test)",
                "HT",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.HECO_TEST_RPC_URL,
                "https://testnet.hecoinfo.com/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.HECO_TEST_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.AVALANCHE_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Avalanche Mainnet C-Chain",
                "AVAX",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.AVALANCHE_RPC_URL,
                "https://cchain.explorer.avax.network/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.AVALANCHE_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.FUJI_TEST_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Avalanche FUJI C-Chain (Test)",
                "AVAX",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.FUJI_TEST_RPC_URL,
                "https://cchain.explorer.avax-test.network/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.FUJI_TEST_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.FANTOM_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Fantom Opera",
                "FTM",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.FANTOM_RPC_URL,
                "https://ftmscan.com/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.FANTOM_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.FANTOM_TEST_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Fantom (Test)",
                "FTM",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.FANTOM_TEST_RPC_URL,
                "https://explorer.testnet.fantom.network/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.FANTOM_TEST_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.MATIC_ID, org.tokenscript.engine.ethereum.NetworkInfo(
                "Polygon",
                "POLY",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.MATIC_RPC_URL,
                "https://polygonscan.com/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.MATIC_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.MATIC_TEST_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Mumbai (Test)",
                "POLY",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.MUMBAI_TEST_RPC_URL,
                "https://mumbai.polygonscan.com/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.MATIC_TEST_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.OPTIMISTIC_MAIN_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Optimistic",
                "ETH",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.OPTIMISTIC_MAIN_URL,
                "https://optimistic.etherscan.io/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.OPTIMISTIC_MAIN_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.OPTIMISTIC_TEST_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Optimistic (Test)",
                "ETH",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.OPTIMISTIC_TEST_URL,
                "https://kovan-optimistic.etherscan.io/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.OPTIMISTIC_TEST_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.CRONOS_TEST_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Cronos (Test)",
                "tCRO",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.CRONOS_TEST_URL,
                "https://cronos-explorer.crypto.org/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.CRONOS_TEST_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.ARBITRUM_MAIN_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Arbitrum One",
                "AETH",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.ARBITRUM_RPC_URL,
                "https://arbiscan.io/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.ARBITRUM_MAIN_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.ARBITRUM_TEST_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Arbitrum Test",
                "ARETH",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.ARBITRUM_TEST_RPC_URL,
                "https://rinkeby-explorer.arbitrum.io/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.ARBITRUM_TEST_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.PALM_ID, org.tokenscript.engine.ethereum.NetworkInfo(
                "PALM",
                "PALM",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.PALM_RPC_URL,
                "https://explorer.palm.io/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.PALM_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.PALM_TEST_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "PALM (Test)",
                "PALM",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.PALM_TEST_RPC_URL,
                "https://explorer.palm-uat.xyz/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.PALM_TEST_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.KLAYTN_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Klaytn Cypress",
                "KLAY",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.KLAYTN_RPC,
                "https://scope.klaytn.com/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.KLAYTN_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.KLAYTN_BOABAB_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Klaytn Boabab (Test)",
                "KLAY",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.KLAYTN_BAOBAB_RPC,
                "https://baobab.scope.klaytn.com/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.KLAYTN_BOABAB_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.AURORA_MAINNET_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Aurora",
                "ETH",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.AURORA_MAINNET_RPC_URL,
                "https://aurorascan.dev/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.AURORA_MAINNET_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.AURORA_TESTNET_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Aurora (Test)",
                "ETH",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.AURORA_TESTNET_RPC_URL,
                "https://testnet.aurorascan.dev/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.AURORA_TESTNET_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.MILKOMEDA_C1_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Milkomeda Cardano",
                "milkADA",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.MILKOMEDA_C1_RPC,
                "https://explorer-mainnet-cardano-evm.c1.milkomeda.com/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.MILKOMEDA_C1_ID,
                false
            )
        )
        org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap.put(
            org.tokenscript.engine.ethereum.EthereumNetworkBase.MILKOMEDA_C1_TEST_ID,
            org.tokenscript.engine.ethereum.NetworkInfo(
                "Milkomeda Cardano (Test)",
                "milktADA",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.MILKOMEDA_C1_TEST_RPC,
                "https://explorer-devnet-cardano-evm.c1.milkomeda.com/tx/",
                org.tokenscript.engine.ethereum.EthereumNetworkBase.MILKOMEDA_C1_TEST_ID,
                false
            )
        )
    }

    fun getNetworkByChain(chainId: Long): org.tokenscript.engine.ethereum.NetworkInfo? {
        return org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap[chainId]
    }

    fun getShortChainName(chainId: Long): String {
        val info: org.tokenscript.engine.ethereum.NetworkInfo? = org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap[chainId]
        return if (info != null) {
            var shortName: String = info.name
            val index = shortName.indexOf(" (Test)")
            if (index > 0) shortName = info.name.substring(0, index)
            if (shortName.length > org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap[org.tokenscript.engine.ethereum.EthereumNetworkBase.CLASSIC_ID]!!.name.length) //shave off the last word
            {
                shortName = shortName.substring(0, shortName.lastIndexOf(" "))
            }
            shortName
        } else {
            org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap[org.tokenscript.engine.ethereum.EthereumNetworkBase.MAINNET_ID]!!.name
        }
    }

    fun getChainSymbol(chainId: Long): String {
        val info: org.tokenscript.engine.ethereum.NetworkInfo? = org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap[chainId]
        return if (info != null) {
            info.symbol
        } else {
            org.tokenscript.engine.ethereum.EthereumNetworkBase.networkMap[org.tokenscript.engine.ethereum.EthereumNetworkBase.MAINNET_ID]!!.symbol
        }
    }
}
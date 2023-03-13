package org.tokenscript.engine.token.entity

import org.tokenscript.engine.ethereum.EthereumNetworkBase
import org.tokenscript.engine.ethereum.EthereumNetworkBase.ARTIS_SIGMA1_ID
import org.tokenscript.engine.ethereum.EthereumNetworkBase.ARTIS_TAU1_ID
import org.tokenscript.engine.ethereum.EthereumNetworkBase.CLASSIC_ID
import org.tokenscript.engine.ethereum.EthereumNetworkBase.GOERLI_ID
import org.tokenscript.engine.ethereum.EthereumNetworkBase.KOVAN_ID
import org.tokenscript.engine.ethereum.EthereumNetworkBase.MAINNET_ID
import org.tokenscript.engine.ethereum.EthereumNetworkBase.POA_ID
import org.tokenscript.engine.ethereum.EthereumNetworkBase.RINKEBY_ID
import org.tokenscript.engine.ethereum.EthereumNetworkBase.ROPSTEN_ID
import org.tokenscript.engine.ethereum.EthereumNetworkBase.SOKOL_ID
import org.tokenscript.engine.ethereum.EthereumNetworkBase.XDAI_ID
import org.tokenscript.engine.ethereum.NetworkInfo

/**
 * Created by James on 2/03/2019.
 * Stormbird in Singapore
 */
object MagicLinkInfo {
    //domains for DMZ
    const val mainnetMagicLinkDomain = "aw.app"
    private const val legacyMagicLinkDomain = "app.awallet.io"
    private const val classicMagicLinkDomain = "classic.aw.app"
    private const val callistoMagicLinkDomain = "callisto.aw.app"
    private const val kovanMagicLinkDomain = "kovan.aw.app"
    private const val ropstenMagicLinkDomain = "ropsten.aw.app"
    private const val rinkebyMagicLinkDomain = "rinkeby.aw.app"
    private const val poaMagicLinkDomain = "poa.aw.app"
    private const val sokolMagicLinkDomain = "sokol.aw.app"
    private const val xDaiMagicLinkDomain = "xdai.aw.app"
    private const val goerliMagicLinkDomain = "goerli.aw.app"
    private const val artisSigma1MagicLinkDomain = "artissigma1.aw.app"
    private const val artisTau1MagicLinkDomain = "artistau1.aw.app"
    private const val customMagicLinkDomain = "custom.aw.app"

    //Etherscan domains
    private const val mainNetEtherscan = "https://cn.etherscan.com/"
    private const val classicEtherscan = "https://blockscout.com/etc/mainnet/"
    private const val callistoEtherscan = "https://etherscan.io/" //TODO: determine callisto etherscan
    private const val kovanEtherscan = "https://kovan.etherscan.io/"
    private const val ropstenEtherscan = "https://ropsten.etherscan.io/"
    private const val rinkebyEtherscan = "https://rinkeby.etherscan.io/"
    private const val poaEtherscan = "https://blockscout.com/poa/core/"
    private const val sokolEtherscan = "https://blockscout.com/poa/sokol/"
    private const val xDaiEtherscan = "https://blockscout.com/poa/dai/"
    private const val goerliEtherscan = "https://goerli.etherscan.io/"
    private const val artisSigma1Etherscan = "https://explorer.sigma1.artis.network/"
    private const val artisTau1Etherscan = "https://explorer.tau1.artis.network/"
    fun getNetworkNameById(networkId: Long): String {
        val info: NetworkInfo? = org.tokenscript.engine.ethereum.EthereumNetworkBase.getNetworkByChain(networkId)
        return if (info != null) {
            info.name
        } else {
            org.tokenscript.engine.ethereum.EthereumNetworkBase.getNetworkByChain(MAINNET_ID)!!.name
        }
    }

    fun getMagicLinkDomainFromNetworkId(networkId: Long): String {
        return when (networkId.toInt()) {
            0 -> legacyMagicLinkDomain
            MAINNET_ID.toInt() -> mainnetMagicLinkDomain
            KOVAN_ID.toInt() -> kovanMagicLinkDomain
            ROPSTEN_ID.toInt() -> ropstenMagicLinkDomain
            RINKEBY_ID.toInt() -> rinkebyMagicLinkDomain
            POA_ID.toInt() -> poaMagicLinkDomain
            SOKOL_ID.toInt() -> sokolMagicLinkDomain
            CLASSIC_ID.toInt() -> classicMagicLinkDomain
            XDAI_ID.toInt() -> xDaiMagicLinkDomain
            GOERLI_ID.toInt() -> goerliMagicLinkDomain
            ARTIS_SIGMA1_ID.toInt() -> artisSigma1MagicLinkDomain
            ARTIS_TAU1_ID.toInt() -> artisTau1MagicLinkDomain
            else -> mainnetMagicLinkDomain
        }
    }

    //For testing you will not have the correct domain (localhost)
    //To test, alter the else statement to return the network you wish to test
    fun getNetworkIdFromDomain(domain: String?): Long {
        return when (domain) {
            mainnetMagicLinkDomain -> MAINNET_ID
            legacyMagicLinkDomain -> MAINNET_ID
            classicMagicLinkDomain -> CLASSIC_ID
            kovanMagicLinkDomain -> KOVAN_ID
            ropstenMagicLinkDomain -> ROPSTEN_ID
            rinkebyMagicLinkDomain -> RINKEBY_ID
            poaMagicLinkDomain -> POA_ID
            sokolMagicLinkDomain -> SOKOL_ID
            xDaiMagicLinkDomain -> XDAI_ID
            goerliMagicLinkDomain -> GOERLI_ID
            artisSigma1MagicLinkDomain -> ARTIS_SIGMA1_ID
            artisTau1MagicLinkDomain -> ARTIS_TAU1_ID
            else -> MAINNET_ID
        }
    }

    //TODO: Refactor to use the centralised source
    fun getEtherscanURLbyNetwork(networkId: Long): String {
        return when (networkId.toInt()) {
            MAINNET_ID.toInt() -> mainNetEtherscan
            KOVAN_ID.toInt() -> kovanEtherscan
            ROPSTEN_ID.toInt() -> ropstenEtherscan
            RINKEBY_ID.toInt() -> rinkebyEtherscan
            POA_ID.toInt() -> poaEtherscan
            SOKOL_ID.toInt() -> sokolEtherscan
            CLASSIC_ID.toInt() -> classicEtherscan
            XDAI_ID.toInt() -> xDaiEtherscan
            GOERLI_ID.toInt() -> goerliEtherscan
            ARTIS_SIGMA1_ID.toInt() -> artisSigma1Etherscan
            ARTIS_TAU1_ID.toInt() -> artisTau1Etherscan
            else -> mainNetEtherscan
        }
    }

    fun identifyChainId(link: String?): Long {
        if (link == null || link.length == 0) return 0
        var chainId: Long = 0
        //split out the chainId from the magiclink
        val index = link.indexOf(mainnetMagicLinkDomain)
        val dSlash = link.indexOf("://")
        val legacy = link.indexOf(legacyMagicLinkDomain)
        //try new style link
        if (index > 0 && dSlash > 0) {
            val domain = link.substring(dSlash + 3, index + mainnetMagicLinkDomain.length)
            chainId = getNetworkIdFromDomain(domain)
        } else if (legacy > 0) {
            chainId = 0
        }
        return chainId
    }

    fun generatePrefix(chainId: Long): String {
        return "https://" + getMagicLinkDomainFromNetworkId(chainId) + "/"
    }
}
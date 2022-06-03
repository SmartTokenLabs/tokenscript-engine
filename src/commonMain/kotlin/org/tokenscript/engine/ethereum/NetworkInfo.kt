package org.tokenscript.engine.ethereum

/* it's some kind of Trust Ethereum Wallet naming convention that a
 * class that has no behaviour (equivalent of C's struct) is called
 * SomethingInfo. I didn't agree with this naming convention but I'll
 * keep it here */
class NetworkInfo(
    val name: String,
    val symbol: String,
    val rpcServerUrl: String,
    // This is used by the Transaction Detail page for the user to visit a website with detailed transaction information
    val etherscanUrl: String,
    val chainId: Long,
    val isCustom: Boolean
)
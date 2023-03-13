package org.tokenscript.engine.token.entity

/**
 * Created by James on 2/05/2019.
 * Stormbird in Sydney
 */
class ContractInfo {
    val contractInterface: String
    val addresses: MutableMap<Long, MutableList<String>> = HashMap()

    constructor(contractType: String, addresses: Map<Long, MutableList<String>>) {
        contractInterface = contractType
        this.addresses.putAll(addresses)
    }

    constructor(contractType: String) {
        contractInterface = contractType
    }

    fun hasContractTokenScript(chainId: Long, address: String): Boolean {
        val addrs = addresses[chainId]
        return addrs != null && addrs.contains(address)
    }

    fun getfirstChainId(): Long {
        return if (addresses.keys.size > 0) addresses.keys.iterator().next() else 0
    }

    val firstAddress: String
        get() {
            val chainId = getfirstChainId()
            return if (addresses[chainId]!!.size > 0) addresses[chainId]!![0] else ""
        }
}
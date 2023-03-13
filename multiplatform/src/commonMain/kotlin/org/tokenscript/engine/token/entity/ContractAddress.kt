package org.tokenscript.engine.token.entity

/**
 * Created by James on 15/05/2019.
 * Stormbird in Sydney
 */
class ContractAddress {
    val chainId: Long
    val address: String

    constructor(chainId: Long, address: String) {
        this.chainId = chainId
        this.address = address
    }

    constructor(chainAddr: String) {
        val sp = chainAddr.split("-".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
        address = sp[0]
        chainId = sp[1].toLong()
    }

    val addressKey: String
        get() = address.lowercase() + "-" + chainId

    //TODO: Only allow FunctionDefinition to have one contract
    constructor(fd: FunctionDefinition) {
        chainId = fd.contract!!.addresses.keys.iterator().next()
        address = fd.contract!!.addresses.get(chainId)!!.iterator().next()
    }
}
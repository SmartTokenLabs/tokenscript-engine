package org.tokenscript.engine.token.entity

import com.ionspin.kotlin.bignum.integer.BigInteger

/**
 * Created by James on 10/02/2018.
 */
/**
 * This should purely be a container class of NonFungibleToken
 *
 */
class TicketRange {
    var isChecked: Boolean
    var exposeRadio: Boolean
    var contractAddress // Should this be address or actual token?
            : String
    var tokenIds: MutableList<BigInteger>?

    constructor(tokenId: BigInteger, contractAddress: String) {
        this.contractAddress = contractAddress
        tokenIds = ArrayList<BigInteger>()
        tokenIds!!.add(tokenId)
        isChecked = false
        exposeRadio = false
    }

    constructor(tokenIds: MutableList<BigInteger>?, contractAddress: String, isChecked: Boolean) {
        this.contractAddress = contractAddress
        this.tokenIds = tokenIds
        this.isChecked = isChecked
        exposeRadio = false
    }

    fun selectSubRange(count: Int) {
        if (count < tokenIds!!.size) {
            tokenIds = tokenIds!!.subList(0, count)
        }
    }

    fun equals(compare: TicketRange?): Boolean {
        if (compare == null || compare.tokenIds!!.size != tokenIds!!.size) return false
        for (i in tokenIds!!.indices) {
            val id: BigInteger = tokenIds!![i]
            if (id != compare.tokenIds!![i]) return false
        }
        return true
    }
}
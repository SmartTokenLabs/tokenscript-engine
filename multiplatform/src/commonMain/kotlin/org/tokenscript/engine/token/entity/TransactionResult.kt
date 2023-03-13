package org.tokenscript.engine.token.entity

import com.ionspin.kotlin.bignum.integer.BigInteger
import kotlinx.datetime.Clock

/**
 * Created by James on 7/05/2019.
 * Stormbird in Sydney
 */
class TransactionResult(
    val contractChainId: Long,
    val contractAddress: String,
    tokenId: BigInteger,
    attr: Attribute
) {
    val tokenId: BigInteger
    var method: String? = null
    var result: String?
    var resultTime: Long
    val attrId: String

    init {
        this.tokenId = tokenId
        if (attr.function != null) method = attr.function?.method else if (attr.event != null) method =
            attr.name //for event store attribute name
        else method = attr.label
        attrId = attr.name.toString()
        result = null
        resultTime = 0
    }

    fun needsUpdating(lastTxTime: Long): Boolean {
        //if contract had new transactions then update, or if last tx was -1 (always check)
        return resultTime == 0L || Clock.System.now().toEpochMilliseconds() + 5 * 10 * 1000 < resultTime || lastTxTime < 0 || lastTxTime > resultTime
    }
}
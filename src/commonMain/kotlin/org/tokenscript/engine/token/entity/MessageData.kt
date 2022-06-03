package org.tokenscript.engine.token.entity

import com.ionspin.kotlin.bignum.integer.BigInteger

/**
 * Created by James on 21/03/2018.
 */
class MessageData {
    var priceWei: BigInteger? = null
    lateinit var tickets: IntArray
    var signature = ByteArray(65)
}
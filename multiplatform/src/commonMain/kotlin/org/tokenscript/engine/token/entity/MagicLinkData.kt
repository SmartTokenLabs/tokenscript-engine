package org.tokenscript.engine.token.entity

import com.ionspin.kotlin.bignum.integer.BigInteger

class MagicLinkData {
    var expiry: Long = 0
    lateinit var prefix: ByteArray
    var nonce: BigInteger? = null
    var price = 0.0
    var priceWei: BigInteger? = null
    var tokenIds: List<BigInteger>? = null
    lateinit var indices: IntArray
    var amount: BigInteger? = null
    var ticketStart = 0
    var ticketCount = 0
    var contractAddress: String? = null
    var signature = ByteArray(65)
    var message: ByteArray? = null
    var ownerAddress: String? = null
    var contractName: String? = null
    var contractType: Byte = 0
    var chainId: Long = 0
    var balanceInfo: List<BigInteger>? = null

    //check this order is not corrupt
    //first check the owner address - we should already have called getOwnerKey
    val isValidOrder: Boolean
        get() {
            //check this order is not corrupt
            //first check the owner address - we should already have called getOwnerKey
            var isValid = true
            if (ownerAddress == null || ownerAddress!!.length < 20) isValid = false
            if (contractAddress == null || contractAddress!!.length < 20) isValid = false
            if (message == null) isValid = false
            return isValid
        }

    fun balanceChange(balance: List<BigInteger>): Boolean {
        //compare two balances
        //quick return, if sizes are different there's a change
        if (balanceInfo == null) {
            balanceInfo = ArrayList() //initialise the balance list
            return true
        }
        if (balance.size != balanceInfo!!.size) return true
        val oldBalance: MutableList<BigInteger> = ArrayList(balanceInfo!!)
        val newBalance: MutableList<BigInteger> = ArrayList(balance)
        oldBalance.removeAll(balanceInfo!!)
        newBalance.removeAll(balance)
        return oldBalance.size != 0 || newBalance.size != 0
    }
}
package org.tokenscript.engine.token.entity

import com.ionspin.kotlin.bignum.integer.BigInteger

/**
 * Created by James on 22/05/2019.
 * Stormbird in Sydney
 */
interface AttributeInterface {
    fun getFunctionResult(
        contract: ContractAddress?,
        attr: Attribute?,
        tokenId: BigInteger?
    ): TransactionResult?

    fun storeAuxData(walletAddress: String?, tResult: TransactionResult?): TransactionResult?
    fun resolveOptimisedAttr(
        contract: ContractAddress?,
        attr: Attribute?,
        transactionResult: TransactionResult?
    ): Boolean

    val walletAddr: String?
    fun getLastTokenUpdate(chainId: Long, address: String?): Long {
        return 0
    }

    fun fetchAttribute(origin: ContractInfo?, attributeName: String?): Attribute? {
        return null
    }

    fun fetchAttrResult(
        origin: ContractAddress?,
        attr: Attribute?,
        tokenId: BigInteger?
    ): TokenScriptResult.Attribute? {
        return null
    }
}
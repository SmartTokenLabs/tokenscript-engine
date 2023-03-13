package org.tokenscript.engine.token.entity

import com.ionspin.kotlin.bignum.integer.BigInteger
import org.tokenscript.engine.token.tools.TokenDefinition

/**
 * Created by James on 10/11/2018.
 * Stormbird in Singapore
 */
class FunctionDefinition {
    var contract: ContractInfo? = null
    var method: String? = null
    var syntax: TokenDefinition.Syntax? = null
    var `as`: As? = null
    var parameters: MutableList<MethodArg> = ArrayList()
    var result: String? = null
    var resultTime: Long = 0
    var tokenId: BigInteger? = null
    var tx: EthereumTransaction? = null
    val tokenRequirement: Int
        get() {
            var count = 0
            for (arg in parameters!!) {
                if (arg.isTokenId == true) count++
            }
            if (count == 0) count = 1
            return count
        }
}
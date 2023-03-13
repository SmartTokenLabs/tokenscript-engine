package org.tokenscript.engine.token.entity

/**
 * Created by James on 2/05/2019.
 * Stormbird in Sydney
 */
// A param to pass into a smart contract function call
class MethodArg {
    var parameterType //type of param eg uint256, address etc
            : String? = null
    var element // contains either the value or reference to the value
            : TokenscriptElement? = null
    val isTokenId: Boolean?
        get() = element?.isToken
    val tokenIndex: Int?
        get() = element?.tokenIndex
}
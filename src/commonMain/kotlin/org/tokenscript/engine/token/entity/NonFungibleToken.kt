package org.tokenscript.engine.token.entity

import com.ionspin.kotlin.bignum.integer.BigInteger
import org.tokenscript.engine.token.tools.TokenDefinition

/**
 * Created by weiwu on 1/3/18.  Each NonFungibleToken is a
 * non-fungible token identified by a byte32 tokenID (other forms of
 * IDs may be added if tests proves that they can be more efficient).
 */
class NonFungibleToken(tokenId: BigInteger?) {
    var id: BigInteger?
    var attributes: HashMap<String, Attribute> = HashMap()

    class Attribute(val id: String, var name: String, value: BigInteger, var text: String?) {
        val value: BigInteger

        init {
            this.value = value
        }
    }



    fun getAttribute(attributeId: String?): Attribute? {
        return attributes.get(attributeId)
    }

    fun setAttribute(attributeId: String?, attribute: Attribute?) {
        if (attributeId != null && attribute != null) {
            attributes.put(attributeId, attribute)
        }
    }

    constructor(
        tokenId: BigInteger?,
        ad: TokenDefinition,
        functionMappings: Map<String?, FunctionDefinition?>?
    ) : this(tokenId) {
        if (tokenId != null) {
            ad.parseField(tokenId, this, functionMappings)
        }
    }

    constructor(tokenId: BigInteger?, tsr: TokenScriptResult) : this(tokenId) {
        for (attr in tsr.attributes?.values!!) {
            attributes.put(attr.id, Attribute(attr.id, attr.name, attr.value, attr.text))
        }
    }

    constructor(tokenId: BigInteger?, ad: TokenDefinition) : this(tokenId) {
        if (tokenId != null) {
            ad.parseField(tokenId, this)
        }
    }

    init {
        id = tokenId
        attributes = HashMap()
    }

    fun getRangeStr(data: TicketRange): String {
        val ticketStart: Int = getAttribute("category")!!.value.intValue()
        var ticketRange = ticketStart.toString()
        if (data.tokenIds != null) {
            val lastValue: Int = ticketStart + (data.tokenIds!!.size - 1)
            if (data.tokenIds!!.size > 1) {
                ticketRange = "$ticketRange-$lastValue"
            }
        }
        return ticketRange
    }
}
package org.tokenscript.engine.token.entity

import com.ionspin.kotlin.bignum.integer.BigInteger

/**
 * Created by James on 14/05/2019.
 * Stormbird in Sydney
 */
class TokenScriptResult {
    class Attribute {
        val id: String
        var name: String
        var text: String
        val value: BigInteger
        val userInput: Boolean

        constructor(attributeId: String, name: String, value: BigInteger, text: String) {
            id = attributeId
            this.name = name
            this.text = text
            this.value = value
            userInput = false
        }

        constructor(attributeId: String, name: String, value: BigInteger, text: String, userInput: Boolean) {
            id = attributeId
            this.name = name
            this.text = text
            this.value = value
            this.userInput = userInput
        }
    }

    private val attrs: MutableMap<String, Attribute>? = HashMap<String, Attribute>()
    fun setAttribute(key: String, attr: Attribute) {
        attrs!![key] = attr
    }

    val attributes: Map<String, Attribute>?
        get() = attrs

    fun getAttribute(attributeId: String): Attribute? {
        return attrs?.get(attributeId)
    }

    companion object {
        /*fun <T> addPair(attrs: StringBuilder, attrId: String?, attrValue: T?) {
            attrs.append(attrId)
            attrs.append(": ")
            if (attrValue == null) {
                attrs.append("\"\"")
            } else if (attrValue is BigInteger) {
                attrs.append("\"")
                attrs.append((attrValue as BigInteger).toString(10))
                attrs.append("\"")
            } else if (attrValue is List<*>) {
                attrs.append("\'")
                attrs.append(Gson().toJson(attrValue))
                attrs.append("\'")
            } else {
                val attrValueStr = attrValue as String
                if (attrValueStr.length == 0 || attrValueStr[0] != '{') attrs.append("\"")
                attrs.append(attrValueStr)
                if (attrValueStr.length == 0 || attrValueStr[0] != '{') attrs.append("\"")
            }
            attrs.append(",\n")
        }*/
    }
}
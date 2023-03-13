package org.tokenscript.engine.token.entity

import com.ionspin.kotlin.bignum.integer.BigInteger
import org.tokenscript.engine.token.entity.TSSelection.Companion.decodeParam

/**
 * Created by JB on 21/05/2020.
 */
class TSFilterNode {
    var parent: TSFilterNode? = null
    var first: TSFilterNode? = null
    var second: TSFilterNode? = null
    var type: FilterType
    var negate = false
    var value: BigInteger? = null
    var strValue: String? = null
    var logic: LogicState? = LogicState.NONE

    constructor(value: String, p: TSFilterNode?, t: FilterType) {

        var strVal: String = value;

        if (t === FilterType.ATTRIBUTE) {
            strVal = extractAttribute(strVal)
        }
        type = t
        try {
            this.value = BigInteger.parseString(value)
            this.strValue = strVal
        } catch (e: Exception) {
            if (value.equals("true", ignoreCase = true)) {
                logic = LogicState.TRUE
            } else if (value.equals("false", ignoreCase = true)) {
                logic = LogicState.FALSE
            } else {
                strValue = strVal
            }
            this.value = null
        }
        parent = p
    }

    constructor(type: FilterType, p: TSFilterNode?) {
        this.type = type
        parent = p
    }

    val isLeafLogic: Boolean
        get() = isLeafLogic(type)
    val isNodeLogic: Boolean
        get() = when (type) {
            FilterType.AND, FilterType.OR -> true
            else -> false
        }

    fun evaluate(attrs: Map<String?, TokenScriptResult.Attribute>): LogicState {
        val valueLeftStr = getValue(first, attrs)
        val valueRightStr = getValue(second, attrs)
        val valueLeft: BigInteger? = getBIValue(first, attrs)
        val valueRight: BigInteger? = getBIValue(second, attrs)
        val bothSidesValues = valueLeft != null && valueRight != null
        return if (valueLeftStr == null || valueRightStr == null) LogicState.FALSE else when (type) {
            FilterType.EQUAL ->                 //compare strings
                compareLogic(valueLeftStr.equals(valueRightStr, ignoreCase = true))
            FilterType.GREATER_THAN -> {
                //both sides must be values
                if (!bothSidesValues) LogicState.FALSE else compareLogic(
                    valueLeft?.compareTo(valueRight!!)!! > 0
                )
            }
            FilterType.LESS_THAN -> {
                //both sides must be values
                if (!bothSidesValues) LogicState.FALSE else compareLogic(
                    valueLeft?.compareTo(valueRight!!)!! < 0
                )
            }
            FilterType.GREATER_THAN_OR_EQUAL -> {
                //both sides must be values
                if (!bothSidesValues) LogicState.FALSE else compareLogic(
                        valueLeft?.compareTo(valueRight!!)!! >= 0
                )
            }
            FilterType.LESS_THAN_OR_EQUAL_TO -> {
                //both sides must be values
                if (!bothSidesValues) LogicState.FALSE else compareLogic(
                    valueLeft?.compareTo(
                        valueRight!!
                    )!! <= 0
                )
            }
            else ->                 // should have caught this previously
                LogicState.FALSE
        }
    }

    private fun compareLogic(comparison: Boolean?): LogicState {
        return if (comparison == true) {
            if (negate) LogicState.FALSE else LogicState.TRUE
        } else {
            if (negate) LogicState.TRUE else LogicState.FALSE
        }
    }

    private fun getBIValue(
        node: TSFilterNode?,
        attrs: Map<String?, TokenScriptResult.Attribute>
    ): BigInteger? {
        var returnValue: BigInteger? = null
        if (node!!.strValue != null && node.strValue!!.length > 0) {
            val attr: TokenScriptResult.Attribute? = attrs[node.strValue]
            returnValue = if (attr != null) {
                //found an attribute
                attr.value
            } else {
                node.value
            }
        }
        return returnValue
    }

    private fun getValue(node: TSFilterNode?, attrs: Map<String?, TokenScriptResult.Attribute>): String? {
        var returnValue: String? = null
        if (node!!.logic != null && node.logic != LogicState.NONE) {
            returnValue = node.logic.toString()
        } else if (node.type === FilterType.ATTRIBUTE) {
            val attr: TokenScriptResult.Attribute? = attrs[node.strValue]
            if (attr != null) {
                //found an attribute
                returnValue = attr.text
            }
        } else if (node.strValue != null && node.strValue!!.length > 0) {
            returnValue = node.strValue
        }
        return returnValue
    }

    val isEvaluated: Boolean
        get() = if ((isNodeLogic || isLeafLogic) && logic != LogicState.NONE) {
            true
        } else {
            type === FilterType.VALUE
        }

    fun evaluate(): LogicState {
        if (!isNodeLogic) return LogicState.NONE
        val eval = first!!.logic == LogicState.TRUE && second!!.logic == LogicState.TRUE
        return if (eval) {
            if (negate) LogicState.FALSE else LogicState.TRUE
        } else {
            if (negate) LogicState.TRUE else LogicState.FALSE
        }
    }

    private fun extractAttribute(value: String): String {
        //val matcher: java.util.regex.Matcher = decodeParam.matcher(value)
        val result = decodeParam.find(value);
        return if (result != null && result.groups[1] != null) {
            //found an attribute param
            result.groups[1]!!.value
        } else {
            value
        }
    }

    enum class LogicState {
        NONE, TRUE, FALSE
    }

    companion object {
        fun isLeafLogic(type: FilterType?): Boolean {
            return when (type) {
                FilterType.AND, FilterType.OR, FilterType.NOT -> false
                FilterType.LESS_THAN, FilterType.EQUAL, FilterType.GREATER_THAN, FilterType.GREATER_THAN_OR_EQUAL, FilterType.LESS_THAN_OR_EQUAL_TO -> true
                FilterType.VALUE -> false
                else -> false
            }
        }
    }
}
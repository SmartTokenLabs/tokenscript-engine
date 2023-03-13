package org.tokenscript.engine.token.entity

import com.ionspin.kotlin.bignum.integer.BigInteger
import com.ionspin.kotlin.bignum.integer.Sign
import com.soywiz.klock.DateTimeTz
import com.soywiz.klock.ISO8601
import io.ktor.utils.io.charsets.*
import io.ktor.utils.io.core.*
import nl.adaptivity.xmlutil.dom.*
import org.tokenscript.engine.token.tools.Numeric
import org.tokenscript.engine.token.tools.TokenDefinition
import org.tokenscript.engine.token.util.DateTimeFactory
import kotlin.String

/**
 * Created by James on 9/05/2019.
 * Stormbird in Sydney
 */
class Attribute(attr: Element, def: TokenDefinition) {
    //default the bitmask to 32 bytes represented
    var bitmask = BigInteger.parseString("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", 16)

    // TODO: BigIntegereger !== BitInt. Test edge conditions.
    var label // TODO: should be polyglot because user change change language in the run
            : String?
    val name: String?
    var bitshift = 0
    var syntax: TokenDefinition.Syntax
    var astype: As = As.Unsigned
    val members: MutableMap<BigInteger, String> = HashMap()
    var originContract: ContractInfo?
    var function: FunctionDefinition? = null
    var event: EventDefinition? = null
    var userInput = false

    init {
        originContract = def.contracts.get(def.holdingToken)
        //schema 2020/06 id is now name; name is now label
        name = attr.getAttribute("name")
        label = name //set label to name if not specified
        //TODO xpath would be better
        syntax = TokenDefinition.Syntax.DirectoryString //default value
        var node: Node? = attr.getFirstChild()
        while (node != null) {
            if (node.getNodeType() == NodeConsts.ELEMENT_NODE) {
                val element: Element = node as Element
                when (node.getLocalName()) {
                    "type" -> syntax = handleType(element)!!
                    "origins" -> handleOrigins(element, def)
                    "label" -> {
                        label = def.getLocalisedString(element)
                        populate(element, def)
                    }
                    "mapping" -> populate(element, def)
                }
                when (element.getAttribute("contract")?.lowercase()) {
                    "holding-contract" -> this.astype = As.Mapping
                    else -> {}
                }
            }
            node = node.getNextSibling()
        }
        //if (bitmask != null) {
            while (bitmask.rem(BigInteger(1).shl(++bitshift)) == BigInteger(0)) {
                bitshift--
            }
        //}
    }

    private fun handleType(syntax: Element): TokenDefinition.Syntax? {
        var ds: TokenDefinition.Syntax? = TokenDefinition.Syntax.DirectoryString
        var node: Node? = syntax.getFirstChild()
        while (node != null) {
            if (node.getNodeType() == NodeConsts.ELEMENT_NODE) {
                val element: Element = node as Element
                when (element.getLocalName()) {
                    "syntax" -> ds = getSyntax(element.getTextContent())
                    else -> println("Possible fail: " + element.getLocalName() + " in attribute '" + name + "'")
                }
            }
            node = node.getNextSibling()
        }
        return ds
    }

    private fun getSyntax(ISO: String?): TokenDefinition.Syntax? {
        when (ISO) {
            "1.3.6.1.4.1.1466.115.121.1.6" -> return TokenDefinition.Syntax.BitString
            "1.3.6.1.4.1.1466.115.121.1.7" -> return TokenDefinition.Syntax.Boolean
            "1.3.6.1.4.1.1466.115.121.1.11" -> return TokenDefinition.Syntax.CountryString
            "1.3.6.1.4.1.1466.115.121.1.28" -> return TokenDefinition.Syntax.JPEG
            "1.3.6.1.4.1.1466.115.121.1.36" -> return TokenDefinition.Syntax.NumericString
            "1.3.6.1.4.1.1466.115.121.1.24" -> return TokenDefinition.Syntax.GeneralizedTime
            "1.3.6.1.4.1.1466.115.121.1.26" -> return TokenDefinition.Syntax.IA5String
            "1.3.6.1.4.1.1466.115.121.1.27" -> return TokenDefinition.Syntax.Integer
            "1.3.6.1.4.1.1466.115.121.1.15" -> return TokenDefinition.Syntax.DirectoryString
        }
        return null
    }

    private fun handleOrigins(origin: Element, def: TokenDefinition) {
        var node: Node? = origin.getFirstChild()
        while (node != null) {
            if (node.getNodeType() == NodeConsts.ELEMENT_NODE) {
                val resolve: Element = node as Element
                this.astype = def.parseAs(resolve)
                if (resolve.getPrefix() == "ethereum") //handle ethereum namespace
                {
                    when (node.getLocalName()) {
                        "transaction", "call" -> function = def.parseFunction(resolve, syntax)
                        "event" -> {
                            event = def.parseEvent(resolve)
                            event?.attributeName = name
                            event?.parentAttribute = this
                        }
                        else -> {}
                    }
                } else {
                    when (node.getLocalName()) {
                        "token-id" -> {
                            //this value is obtained from the token name
                            this.astype = def.parseAs(resolve)
                            populate(resolve, def) //check for mappings
                            if (function != null)
                                function!!.`as` = def.parseAs(resolve)
                            if (resolve.hasAttribute("bitmask")) {
                                resolve.getAttribute("bitmask")?.let {
                                    bitmask = BigInteger.parseString(it, 16)
                                }
                            }
                        }
                        "user-entry" -> {
                            userInput = true
                            this.astype = def.parseAs(resolve)
                            if (resolve.hasAttribute("bitmask")) {
                                resolve.getAttribute("bitmask")?.let {
                                    bitmask = BigInteger.parseString(it, 16)
                                }
                            }
                        }
                    }
                }
            }
            node = node.getNextSibling()
        }
    }

    private fun populate(origin: Element, def: TokenDefinition) {
        var option: Element
        var n: Node? = origin.getFirstChild()
        while (n != null) {
            if (n.getNodeType() == NodeConsts.ELEMENT_NODE) {
                val element: Element = n as Element
                if (element.getLocalName() == "mapping") {
                    this.astype = As.Mapping
                    val nList: NodeList = origin.getElementsByTagNameNS(def.nameSpace, "option")
                    for (i in 0 until nList.getLength()) {
                        option = nList.item(i) as Element

                        val key = option.getAttribute("key")
                        val value = def.getLocalisedString(option, "value")

                        if (key != null && value != null){
                            members[BigInteger.parseString(key)] = value
                        }

                    }
                }
            }
            n = n.getNextSibling()
        }
    }

    fun getSyntaxVal(data: String?): String? {
        var data = data ?: return null
        return when (syntax) {
            TokenDefinition.Syntax.DirectoryString -> data
            TokenDefinition.Syntax.IA5String -> data
            TokenDefinition.Syntax.Integer ->                 //convert to integer
                if (data.length == 0) {
                    "0"
                } else if (data[0].isDigit()) {
                    data
                } else {
                    //convert from byte value
                    BigInteger.fromByteArray(data.toByteArray(), Sign.POSITIVE).toString()
                }
            TokenDefinition.Syntax.GeneralizedTime -> {
                //try {
                    //ensure data is alphanum
                    data = checkAlphaNum(data)
                    val dt: DateTimeTz = DateTimeFactory.getDateTime(data)

                    val generalizedTime: String = dt.format(ISO8601.DATETIME_UTC_COMPLETE)
                    return "{ generalizedTime: \"$data\", date: new Date(\"$generalizedTime\") }"
                //} catch (e: java.text.ParseException) {
                    //data
                //}
                if (data.length == 0) return "FALSE"
                if (data[0].isDigit()) {
                    if (data[0] == '0') "FALSE" else "TRUE"
                } else if (data[0].code == 0) "FALSE" else if (data[0].code == 1) "TRUE" else data
            }
            TokenDefinition.Syntax.Boolean -> {
                if (data.isEmpty()) return "FALSE"
                if (data[0].isDigit()) {
                    if (data[0] == '0') "FALSE" else "TRUE"
                } else if (data[0].code == 0) "FALSE" else if (data[0].code == 1) "TRUE" else data
            }
            TokenDefinition.Syntax.BitString -> data
            TokenDefinition.Syntax.CountryString -> data
            TokenDefinition.Syntax.JPEG -> data
            TokenDefinition.Syntax.NumericString -> {
                if (data == null) {
                    return "0"
                } else if (data.startsWith("0x") && this.astype !== As.Address) //Address is a special case where we want the leading 0x
                {
                    data = data.substring(2)
                }
                data
            }
            else -> data
        }
    }

    //Sometimes value needs to be processed from the raw input.
    //Currently only time
    fun processValue(`val`: BigInteger): BigInteger {
        when (syntax) {
            TokenDefinition.Syntax.GeneralizedTime -> return parseGeneralizedTime(`val`)
            TokenDefinition.Syntax.DirectoryString,
            TokenDefinition.Syntax.IA5String,
            TokenDefinition.Syntax.Integer,
            TokenDefinition.Syntax.Boolean,
            TokenDefinition.Syntax.BitString,
            TokenDefinition.Syntax.CountryString,
            TokenDefinition.Syntax.JPEG,
            TokenDefinition.Syntax.NumericString -> {}
        }
        return `val`
    }

    private fun parseGeneralizedTime(value: BigInteger): BigInteger {
        return try {
            val dt: DateTimeTz = DateTimeFactory.getDateTime(toString(value)!!)
            BigInteger(dt.local.unixMillisLong)
        } catch (p: Exception) {
            p.printStackTrace()
            value
        }
    }

    private fun checkAlphaNum(data: String): String {
        var data = data
        for (ch in data.toCharArray()) {
            if (!(ch.isLetter() || ch.isDigit() || ch == '+' || ch == '-' || ch.isWhitespace())
            ) {
                //set to current time
                val date = DateTimeFactory.getCurrentTime()

                date.format(ISO8601.DATETIME_UTC_COMPLETE)
                break
            }
        }
        return data
    }

    /**
     * Converts bitshifted/masked token numeric data into corresponding string.
     * eg. Attr is 'venue'; choices are "1" -> "Kaliningrad Stadium", "2" -> "Volgograd Arena" etc.
     * NB 'time' is Unix EPOCH, which is also a mapping.
     * Since the value may not have a corresponding mapping, but is a valid time we should still return the time value
     * and interpret it as a local time
     *
     * Also - some NF tokens which share a contract with others (eg World Cup, Meetup invites) will have mappings
     * which intentionally have zero value - eg 'Match' has no lookup value for a meeting. Returning null is a guide for the
     * token layout not to show the value.
     *
     * This will become less relevant once the IFrame system is in place - each token appearance will be defined explicitly.
     * However it may be necessary for a default display of token attributes for ease of use while potential
     * users become acquainted with the system.
     *
     * @param data
     * @return
     * @throws UnsupportedEncodingException
     */
    fun toString(data: BigInteger): String? {
        // TODO: in all cases other than UTF8, syntax should be checked
        return when (this.astype) {
            As.UTF8 -> String(data.toByteArray(), charset = Charsets.UTF_8)
            As.Unsigned -> data.toString()
            As.Mapping ->                 // members might be null, but it is better to throw up ( NullPointerException )
                // than silently ignore
                // JB: Existing contracts and tokens throw this error. The wallet 'crashes' each time existing tokens are opened
                // due to assumptions made with extra tickets (ie null member is assumed to return null and not display that element).
                if (members != null && members!!.containsKey(data)) {
                    members!![data]
                } else if (syntax === TokenDefinition.Syntax.GeneralizedTime) {
                    //This is a time entry but without a localised mapped entry. Return the EPOCH time.
                    val date = DateTimeFactory.getDateTime(data.longValue())

                    date.format(ISO8601.DATETIME_UTC_COMPLETE)
                } else {
                    null // have to revert to this behaviour due to values being zero when tokens are created
                    //refer to 'AlphaWallet meetup indices' where 'Match' mapping is null but for FIFA is not.
                    //throw new NullPointerException("Key " + data.toString() + " can't be mapped.");
                }
            As.Boolean -> if (data == BigInteger.ZERO) "FALSE" else "TRUE"
            As.UnsignedInput -> {
                val conv: BigInteger = BigInteger.fromByteArray(data.toByteArray(), Sign.POSITIVE)
                conv.toString()
            }
            As.TokenId -> data.toString()
            As.Bytes -> Numeric.toHexString(data.toByteArray())
            As.Address -> parseEthereumAddress(data)
            else -> throw NullPointerException("Missing valid 'as' attribute")
        }
    }

    private fun parseEthereumAddress(data: BigInteger): String {
        val padded: ByteArray = Numeric.toBytesPadded(data, ADDRESS_LENGTH_IN_BYTES)
        val addr: String = Numeric.toHexString(padded)
        return if (Numeric.cleanHexPrefix(addr).length === ADDRESS_LENGTH_IN_HEX
        ) {
            addr
        } else {
            "<Invalid Address: addr>"
        }
    }

    /**
     * Detects a function call with more than one tokenId present - this means we shouldn't cache the result.
     *
     * @return does the function rely on more than one tokenId input?
     */
    val isMultiTokenCall: Boolean
        get() {
            var tokenIdCount = 0
            if (function != null && function?.parameters != null && function?.parameters?.size!! > 1) {
                for (arg in function?.parameters!!) {
                    if (arg.isTokenId == true) tokenIdCount++
                }
            }
            return tokenIdCount > 1
        }

    /**
     * Any property of the function that makes it volatile should go in here. Recommend we add a 'volatile' keyword.
     *
     * @return
     */
    val isVolatile: Boolean
        get() = isMultiTokenCall

    companion object {
        private const val ADDRESS_SIZE = 160
        private const val ADDRESS_LENGTH_IN_HEX = ADDRESS_SIZE shr 2
        private const val ADDRESS_LENGTH_IN_BYTES = ADDRESS_SIZE shr 3
    }
}
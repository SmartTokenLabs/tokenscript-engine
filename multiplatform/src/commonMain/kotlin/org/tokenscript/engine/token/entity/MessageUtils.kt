package org.tokenscript.engine.token.entity

import io.ktor.utils.io.core.*
import org.tokenscript.engine.token.tools.Numeric

/**
 * Created by JB on 27/08/2020.
 */
object MessageUtils {
    /**
     * Encode params for hashing - the algorithm is very simple, reduce the types like this:
     * (string Message, uint32 value, bytes32 data) into a string list like this:
     * "string Messageuint32 valuebytes32 data"
     *
     * @param rawData
     * @return
     */
    fun encodeParams(rawData: Array<ProviderTypedData>): ByteArray {
        //form the params for hashing
        val sb: StringBuilder = StringBuilder()
        val len = rawData.size
        for (i in 0 until len) {
            sb.append(rawData[i].type).append(" ").append(rawData[i].name)
        }
        return sb.toString().toByteArray()
    }

    /**
     * This routine ported from the reference implementation code at https://github.com/MetaMask/eth-sig-util
     *
     * @param rawData
     * @return
     */
    fun encodeValues(rawData: Array<ProviderTypedData>): ByteArray {
        var size: Int
        val eb = EthereumWriteBuffer()
        for (data in rawData) {
            val type: String = data.type ?: continue
            val value = data.value as String
            if (type == "bytes") {
                eb.writeBytes(Numeric.hexStringToByteArray(value))
            } else if (type == "string") {
                eb.writeBytes(value.toByteArray())
            } else if (type == "bool") {
                eb.writeByte(if (data.value as Boolean) 0x01.toByte() else 0x00.toByte())
            } else if (type == "address") {
                eb.writeAddress(value)
            } else if (type.startsWith("bytes")) {
                size = parseTypeN(type)
                if (size < 1 || size > 32) {
                    throw NumberFormatException("Invalid bytes<N> width: $size")
                }
                eb.writeHexString(value, size)
            } else if (type.startsWith("uint")) {
                size = parseTypeN(type)
                if (size < 8 || size > 256) {
                    throw NumberFormatException("Invalid uint<N> width: $size")
                }
                eb.writeValue(value, size / 8)
            } else if (type.startsWith("int")) {
                size = parseTypeN(type)
                if (size < 8 || size > 256) {
                    throw NumberFormatException("Invalid uint<N> width: $size")
                }
                eb.writeValue(value, size / 8)
            } else {
                // FIXME: support all other types
                throw NumberFormatException("Unsupported or invalid type: $type")
            }
        }

        eb.flush()

        return eb.bytes
    }

    private fun parseTypeN(type: String?): Int {
        val m = Regex("^\\D+(\\d+)$")
        val match = m.find(type.toString())
        if (match != null) {
            val match: String? = match.groups.get(1)?.value
            if (match != null && match.isNotEmpty()) {
                return match.toInt()
            }
        }
        return 256 //if no value then default to 256
    }
}
package org.tokenscript.engine.token.tools

import com.ionspin.kotlin.bignum.decimal.BigDecimal
import com.ionspin.kotlin.bignum.integer.BigInteger
import com.ionspin.kotlin.bignum.integer.Sign
import com.ionspin.kotlin.bignum.integer.toBigInteger
import kotlinx.datetime.Clock
import kotlin.jvm.JvmOverloads

/**
 *
 * Message codec functions.
 *
 *
 * Implementation as per https://github.com/ethereum/wiki/wiki/JSON-RPC#hex-value-encoding
 */
object Numeric {
    private const val HEX_PREFIX = "0x"
    private fun isValidHexQuantity(value: String?): Boolean {
        if (value == null) {
            return false
        }
        return if (value.length < 3) {
            false
        } else value.startsWith(HEX_PREFIX)
    }

    fun cleanHexPrefix(input: String): String {
        return if (containsHexPrefix(input)) {
            input.substring(2)
        } else {
            input
        }
    }

    fun prependHexPrefix(input: String): String {
        return if (!containsHexPrefix(input)) {
            HEX_PREFIX + input
        } else {
            input
        }
    }

    fun containsHexPrefix(input: String): Boolean {
        return input.length > 1 && input[0] == '0' && input[1] == 'x'
    }

    fun toBigInteger(value: ByteArray?, offset: Int, length: Int): BigInteger? {
        return toBigInteger(value?.copyOfRange(offset, offset + length))
    }

    fun toBigInteger(value: ByteArray?): BigInteger? {
        return value?.let { BigInteger.fromByteArray(it, Sign.POSITIVE) }
    }

    fun toBigInteger(hexValue: String): BigInteger? {
        val cleanValue = cleanHexPrefix(hexValue)
        return toBigIntegerNoPrefix(cleanValue)
    }

    fun toBigIntegerNoPrefix(hexValue: String?): BigInteger? {
        return hexValue?.let { BigInteger.parseString(it, 16) }
    }

    fun toHexStringWithPrefix(value: BigInteger): String {
        return HEX_PREFIX + value.toString(16)
    }

    fun toHexStringNoPrefix(value: BigInteger): String {
        return value.toString(16)
    }

    fun toHexStringNoPrefix(input: ByteArray): String {
        return toHexString(input, 0, input.size, false)
    }

    fun toHexStringWithPrefixZeroPadded(value: BigInteger, size: Int): String {
        return toHexStringZeroPadded(value, size, true)
    }

    fun toHexStringNoPrefixZeroPadded(value: BigInteger, size: Int): String {
        return toHexStringZeroPadded(value, size, false)
    }

    private fun toHexStringZeroPadded(value: BigInteger, size: Int, withPrefix: Boolean): String {
        var result: String = toHexStringNoPrefix(value)
        val length = result.length
        if (length > size) {
            throw UnsupportedOperationException(
                "Value " + result + "is larger then length " + size
            )
        } else if (value.signum() < 0) {
            throw UnsupportedOperationException("Value cannot be negative")
        }
        val sb: StringBuilder = StringBuilder()
        for (i in 0 until size - length) sb.append("0")
        if (length < size) {
            result = sb.toString() + result
        }
        return if (withPrefix) {
            HEX_PREFIX + result
        } else {
            result
        }
    }

    fun toBytesPadded(value: BigInteger, length: Int): ByteArray {
        var result = ByteArray(length)
        val bytes: ByteArray = value.toByteArray()
        val bytesLength: Int
        val srcOffset: Int
        if (bytes[0].toInt() == 0) {
            bytesLength = bytes.size - 1
            srcOffset = 1
        } else {
            bytesLength = bytes.size
            srcOffset = 0
        }
        if (bytesLength > length) {
            throw RuntimeException("Input is too large to put in byte array of size $length")
        }
        val destOffset = length - bytesLength

        //java.lang.System.arraycopy(bytes, srcOffset, result, destOffset, bytesLength)
        result = bytes.copyInto(result, destOffset, srcOffset, srcOffset + bytesLength)

        return result
    }

    fun hexStringToByteArray(input: String): ByteArray {
        val cleanInput = cleanHexPrefix(input)
        val len = cleanInput.length
        if (len == 0) {
            return byteArrayOf()
        }
        val data: ByteArray
        val startIdx: Int
        if (len % 2 != 0) {
            data = ByteArray(len / 2 + 1)
            data[0] = (cleanInput[0].digitToIntOrNull(16) ?: -1).toByte()
            startIdx = 1
        } else {
            data = ByteArray(len / 2)
            startIdx = 0
        }
        var i = startIdx
        while (i < len) {
            data[(i + 1) / 2] = ((cleanInput[i].digitToIntOrNull(16) ?: -1 shl 4)
            + cleanInput[i + 1].digitToIntOrNull(16)!! ?: -1).toByte()
            i += 2
        }
        return data
    }

    @JvmOverloads
    fun toHexString(input: ByteArray, offset: Int = 0, length: Int = input.size, withPrefix: Boolean = true): String {
        val stringBuilder: StringBuilder = StringBuilder()
        if (withPrefix) {
            stringBuilder.append("0x")
        }
        for (i in offset until offset + length) {
            stringBuilder.append((input[i].toInt() and 0xFF).toString(16))
        }
        return stringBuilder.toString()
    }

    fun asByte(m: Int, n: Int): Byte {
        return (m shl 4 or n).toByte()
    }

    fun isIntegerValue(value: BigDecimal): Boolean {
        return value.signum() == 0 || value.scale <= 0
    }
}
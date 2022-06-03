package org.tokenscript.engine.token.entity

import com.ionspin.kotlin.bignum.decimal.BigDecimal
import com.ionspin.kotlin.bignum.integer.BigInteger
import com.ionspin.kotlin.bignum.integer.Sign
import com.ionspin.kotlin.bignum.integer.toBigInteger
import io.ktor.utils.io.errors.*
import org.tokenscript.engine.token.tools.Convert
import org.tokenscript.engine.token.tools.Numeric

/**
 * Created by James on 26/03/2018.
 */
class EthereumWriteBuffer {

    var bytes: ByteArray = ByteArray(0)

    fun writeBytes(bytes: ByteArray){
        this.bytes += bytes
    }

    fun writeByte(byte: Byte){
        this.bytes += byte
    }

    fun write32(bi: BigInteger) {
        writeBytes(Numeric.toBytesPadded(bi, 32))
    }

    fun writeAddress(addr: BigInteger) {
        writeBytes(Numeric.toBytesPadded(addr, 20))
    }

    fun writeAddress(addr: String) {
        val addrBI: BigInteger = BigInteger.parseString(Numeric.cleanHexPrefix(addr), 16)
        writeAddress(addrBI)
    }

    fun writeHexString(hex: String, length: Int) {
        val hexBytes: ByteArray = Numeric.hexStringToByteArray(hex)
        val nullByte = List(1, {index -> 0.toByte()}).toByteArray()
        if (hexBytes.size < length) {
            for (i in 0 until length - hexBytes.size) writeBytes(nullByte)
        }
        writeBytes(hexBytes)
    }

    fun writeUnsigned4(value: BigInteger) {
        writeBytes(Numeric.toBytesPadded(value, 4))
    }

    fun writeUnsigned4(value: Long) {
        writeBytes(Numeric.toBytesPadded(BigInteger.fromLong(value), 4))
    }

    fun writeCompressedIndices(indices: IntArray) {
        val uint16 = ByteArray(2)
        val uint8 = ByteArray(1)
        val indexMax = 1 shl 16
        for (i in indices) {
            if (i >= indexMax) {
                throw IOException("Index out of representation range: $i")
            }
            if (i < 1 shl 7) {
                uint8[0] = (i and (1 shl 7).inv()).toByte()
                writeBytes(uint8)
            } else {
                uint16[0] = (i shr 8 or (1 shl 7)).toByte()
                uint16[1] = (i and 0xFF).toByte()
                writeBytes(uint16)
            }
        }
    }

    fun writeTokenIds(tokenIds: List<BigInteger>) {
        for (tokenId in tokenIds) {
            writeBytes(Numeric.toBytesPadded(tokenId, 32))
        }
    }

    fun writeSignature(sig: ByteArray) {
        //assertEquals(sig.length, 65);
        writeBytes(sig)
    }

    fun write4ByteMicroEth(weiValue: BigInteger) {
        val max: ByteArray = Numeric.hexStringToByteArray("FFFFFFFF")
        val maxValue: BigInteger = BigInteger.fromByteArray(max, Sign.POSITIVE)
        //this is value in microeth/szabo
        //convert to wei
        var microEth: BigInteger =
            Convert.fromWei(BigDecimal.fromBigInteger(weiValue), Convert.Unit.SZABO).abs().toBigInteger()
        if (microEth.compareTo(maxValue) > 0) {
            microEth = maxValue //should we signal an overflow error here, or just silently round?
            //possibly irrelevant, this is a huge amount of eth.
        }
        val uValBytes: ByteArray = microEth.ulongValue().toBigInteger().toByteArray()
        writeBytes(uValBytes)
    }

    /**
     * Write any decimal string value of any length into bytes
     * @param value
     * @param convSize
     */
    fun writeValue(value: String, convSize: Int) {
        val value: BigInteger = BigInteger.parseString(value)
        val valueBytes: ByteArray = value.toByteArray()
        var toBeWritten = ByteArray(convSize)
        if (value.compareTo(BigInteger.ZERO) < 0) //pad with 0xFF if value is negative
        {
            for (i in 0 until convSize) toBeWritten[i] = 0xFF.toByte()
        }
        if (valueBytes.size > convSize) {
            toBeWritten = ByteArray(convSize)
            val startTruncate = valueBytes.size - convSize
            //java.lang.System.arraycopy(value.toByteArray(), startTruncate, toBeWritten, 0, convSize)
            value.toByteArray().copyInto(toBeWritten, 0, startTruncate, convSize)
        } else {
            val bytesLength: Int
            val srcOffset: Int
            if (valueBytes[0].toInt() == 0) {
                bytesLength = valueBytes.size - 1
                srcOffset = 1
            } else {
                bytesLength = valueBytes.size
                srcOffset = 0
            }
            val destOffset = convSize - bytesLength
            //java.lang.System.arraycopy(valueBytes, srcOffset, toBeWritten, destOffset, bytesLength)
            valueBytes.copyInto(toBeWritten, srcOffset, destOffset, bytesLength)
        }
        writeBytes(toBeWritten)
    }

    fun flush(): ByteArray {
        val bytes = this.bytes.copyOf();
        this.bytes = ByteArray(0)
        return bytes;
    }
}
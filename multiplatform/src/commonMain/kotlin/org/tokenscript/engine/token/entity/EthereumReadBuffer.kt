package org.tokenscript.engine.token.entity

import com.ionspin.kotlin.bignum.integer.BigInteger
import com.ionspin.kotlin.bignum.integer.Sign
import io.ktor.utils.io.*
import io.ktor.utils.io.errors.*
import org.tokenscript.engine.token.tools.Numeric

/**
 * Created by James on 24/02/2018.
 */
class EthereumReadBuffer(input: ByteArray) {

    private val inputBuffer: ByteReadChannel
    private val readBuffer: ByteArray

    init {
        readBuffer = ByteArray(32)
        inputBuffer = ByteReadChannel(input)
    }

    suspend fun readBI(): BigInteger {
        val retVal: BigInteger
        this.inputBuffer.readAvailable(readBuffer)
        retVal = BigInteger.fromByteArray(readBuffer, Sign.POSITIVE)
        return retVal
    }

    /**
     * Custom BigIntegereger which is formed from a byte array of sz size.
     * @param sz size of bytes to read for the BigIntegereger
     * @return
     * @throws IOException
     */
    suspend fun readBI(sz: Int): BigInteger {
        val retVal: BigInteger
        val buffer = ByteArray(sz)
        this.inputBuffer.readAvailable(buffer)
        retVal = BigInteger.fromByteArray(buffer, Sign.POSITIVE)
        return retVal
    }

    suspend fun readAddress(): String {
        val buffer20 = ByteArray(20)
        this.inputBuffer.readAvailable(buffer20)
        return Numeric.toHexString(buffer20)
    }

    fun available(): Int {
        var remains = 0
        remains = this.inputBuffer.availableForRead
        return remains
    }

    suspend fun readSignature(signature: ByteArray) {
        if (signature.size == 65) {
            this.inputBuffer.readAvailable(signature) // would it throw already, if the data is too short? - Weiwu
        } else {
            throw IOException("Data isn't a signature") // Is this even necessary? - Weiwu
        }
    }

    /*
     * The java 8 recommended way is to read an unsigned Short as Short, and use it as
     * unsigned Short. Here we still use the old method, reading unsigned shorts into int[].
     */
    suspend fun readUnsignedShort(ints: IntArray) {
        for (i in ints.indices) {
            val value = toUnsignedInt(this.inputBuffer.readShort())
            ints[i] = value
        }
    }

    /*
     * equivalent of Short.toUnsignedInt
     */
    private fun toUnsignedInt(s: Short): Int {
        return s.toInt() and 0x0000FFFF
    }

    /*
     * equivalent of Byte.toUnsignedInt
     */
    private fun toUnsignedInt(b: Byte): Int {
        return b.toInt() and 0x000000FF
    } // Int is 32 bits

    /*
     * equivalent of Integer.readUnsignedLong
     */
    fun toUnsignedLong(i: Int): Long {
        return i.toLong() and 0x00000000ffffffffL // long is always 64 bits
    }

    suspend fun readTokenIdsFromSpawnableLink(length: Int): List<BigInteger> {
        var length = length
        val tokenIds: MutableList<BigInteger> = ArrayList<BigInteger>()
        val tokenIdBuffer = ByteArray(32)
        while (length > 0) {
            length -= this.inputBuffer.readAvailable(tokenIdBuffer)
            val tokenId: BigInteger = BigInteger.fromByteArray(tokenIdBuffer, Sign.POSITIVE)
            tokenIds.add(tokenId)
        }
        return tokenIds
    }

    suspend fun readCompressedIndices(indiciesLength: Int): IntArray {
        val readBuffer = ByteArray(indiciesLength)
        val bufferLength: Int = this.inputBuffer.readAvailable(readBuffer)
        var index = 0
        var state = 0
        val indexList: MutableList<Int> = ArrayList<Int>()
        var rValue = 0
        while (index < indiciesLength) {
            val p = toUnsignedInt(readBuffer[index]) // equivalent of Byte.toUnsignedInt()
            when (state) {
                0 -> {
                    //check if we require an extension byte read
                    rValue = p and (1 shl 7).inv() //remove top bit.
                    if (1 shl 7 and p == 1 shl 7) //check if top bit is there
                    {
                        state = 1
                    } else {
                        indexList.add(rValue)
                    }
                }
                1 -> {
                    rValue =
                        (rValue shl 8) + (p and 0xFF) //Low byte + High byte without top bit (which is the extension designation bit)
                    indexList.add(rValue)
                    state = 0
                }
                else -> throw IOException("Illegal state in readCompressedIndicies")
            }
            index++
        }
        val indexArray = IntArray(indexList.size)
        for (i in indexList.indices) indexArray[i] = indexList[i]
        return indexArray
    }

    suspend fun readBytes(i: Int): ByteArray {
        val buffer = ByteArray(i)
        this.inputBuffer.readAvailable(buffer)
        return buffer
    }
}
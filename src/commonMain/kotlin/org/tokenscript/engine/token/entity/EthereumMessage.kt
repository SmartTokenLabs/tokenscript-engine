package org.tokenscript.engine.token.entity

import io.ktor.util.*
import io.ktor.utils.io.*
import io.ktor.utils.io.charsets.*
import io.ktor.utils.io.core.*
import org.tokenscript.engine.token.tools.Numeric
import org.tokenscript.engine.token.tools.Numeric.cleanHexPrefix

/**
 * Class for EthereumMessages to be signed.
 * Weiwu, Aug 2020
 */
class EthereumMessage(
    message: String,
    override val origin: String,
    override val callbackId: Long,
    type: SignMessageType
) : Signable {

    override val userMessage: CharSequence
    override val prehash: ByteArray //this could be supplied on-demand
    override val messageType: SignMessageType

    init {
        messageType = type
        prehash = getEthereumMessage(message)
        userMessage = message
    }

    private fun getEthereumMessage(message: String): ByteArray {
        val encodedMessage: ByteArray
        if (isHex(message)) {
            encodedMessage = Numeric.hexStringToByteArray(message)
        } else {
            encodedMessage = message.toByteArray()
        }
        val result: ByteArray
        if (messageType === SignMessageType.SIGN_PERSONAL_MESSAGE) {
            val prefix = getEthereumMessagePrefix(encodedMessage.size)
            result = ByteArray(prefix.size + encodedMessage.size)

            //java.lang.System.arraycopy(prefix, 0, result, 0, prefix.size)
            prefix.copyInto(result, 0, 0, prefix.size)

            //java.lang.System.arraycopy(encodedMessage, 0, result, prefix.size, encodedMessage.size)
            encodedMessage.copyInto(result, prefix.size, 0, encodedMessage.size)

        } else {
            result = encodedMessage
        }
        return result
    }

    override val message: String?
        get() = userMessage.toString()

    suspend fun getUserMessage(): CharSequence {

        //return if (!java.nio.charset.StandardCharsets.UTF_8.newEncoder().canEncode(userMessage)) {
        return if (!Charsets.UTF_8.newEncoder().encode(userMessage).canRead()) {
            userMessage
        } else {
            try {
                hexToUtf8(userMessage)
            } catch (e: NumberFormatException) {
                userMessage
            }
        }
    }

    private suspend fun hexToUtf8(hexData: CharSequence): String {
        val hex: String = cleanHexPrefix(hexData.toString())
        val byteBuffer = ByteChannel()
        var i = 0
        while (i < hex.length) {

            val byte = hex.substring(i, i + 2).toInt(16).toByte()
            byteBuffer.writeByte(byte)
            i += 2
        }

        return String(byteBuffer.toByteArray(), 0, byteBuffer.toByteArray().size, Charsets.UTF_8)
    }

    private fun isHex(testMsg: String): Boolean {
        var testMsg: String? = testMsg
        if (testMsg == null || testMsg.length == 0) return false
        testMsg = Numeric.cleanHexPrefix(testMsg)
        for (i in 0 until testMsg.length) {
            if ((testMsg[i].digitToIntOrNull(16) ?: -1) == -1) {
                return false
            }
        }
        return true
    }

    private fun getEthereumMessagePrefix(messageLength: Int): ByteArray {
        return MESSAGE_PREFIX.toByteArray() + messageLength.toString().toByteArray()
    }

    companion object {
        const val MESSAGE_PREFIX = "\u0019Ethereum Signed Message:\n"
    }
}
package org.tokenscript.engine.token.entity

import org.tokenscript.engine.token.entity.MessageUtils.encodeParams
import org.tokenscript.engine.token.entity.MessageUtils.encodeValues

class EthereumTypedMessage(
    override var prehash: ByteArray,
    override var origin: String,
    override var callbackId: Long,

// User message is the text shown in the popup window - note CharSequence is used because message contains text formatting
    override var userMessage: CharSequence? = null,
    override var messageType: SignMessageType? = SignMessageType.SIGN_ERROR,
) : Signable {

    /*constructor(messageData: String?, domainName: String, callbackId: Long, cryptoFunctions: CryptoFunctionsInterface) {
        try {
            try {
                val rawData: Array<ProviderTypedData?> =
                    Gson().fromJson(messageData, Array<ProviderTypedData>::class.java)
                val writeBuffer: java.io.ByteArrayOutputStream = java.io.ByteArrayOutputStream()
                writeBuffer.write(cryptoFunctions.keccak256(encodeParams(rawData)))
                writeBuffer.write(cryptoFunctions.keccak256(encodeValues(rawData)))
                userMessage = cryptoFunctions.formatTypedMessage(rawData)
                prehash = writeBuffer.toByteArray()
                messageType = SignMessageType.SIGN_TYPED_DATA
            } catch (e: JsonSyntaxException) {
                prehash = cryptoFunctions.getStructuredData(messageData)
                userMessage = cryptoFunctions.formatEIP721Message(messageData)
                messageType = SignMessageType.SIGN_TYPED_DATA_V3
            }
        } catch (e: java.io.IOException) {
            userMessage = ""
            messageType = SignMessageType.SIGN_ERROR
            e.printStackTrace()
        }
        origin = domainName
        this.callbackId = callbackId
    }*/

    override val message: String get() = userMessage.toString()

}
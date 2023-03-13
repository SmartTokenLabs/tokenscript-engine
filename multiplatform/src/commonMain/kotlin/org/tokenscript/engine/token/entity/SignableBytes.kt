package org.tokenscript.engine.token.entity

/* bytes to be signed without Ethereum Signed Message prefix */
class SignableBytes(override val prehash: ByteArray) : Signable {

    // TODO: weiwu: refactor this from a requirement of Signable eventually
    override val message: String?
        get() = null

    // TODO: weiwu: remove this from a Signable eventually.
    override val callbackId: Long
        get() = 0
    override val origin: String?
        get() = null
    override val userMessage: CharSequence?
        get() = ""
    override val messageType: SignMessageType?
        get() = SignMessageType.SIGN_MESSAGE
}
package org.tokenscript.engine.token.entity

/**
 * Interface for Singable data, for stuff like TBSData (to-be-signed-data), with the view that
 * EthereumMessage, EthereumTypedMessage, EthereumTransaction, X.509 message (attestations)
 * etc eventually use from this
 * Weiwu, Aug 2020
 */
interface Signable {
    val message: String?
    val callbackId: Long
    val prehash: ByteArray?
    val origin: String?
    val userMessage: CharSequence?
    val messageType: SignMessageType?
}
package org.tokenscript.engine.token.entity

import com.ionspin.kotlin.bignum.integer.BigInteger

interface CryptoFunctionsInterface {
    fun Base64Decode(message: String?): ByteArray?
    fun Base64Encode(data: ByteArray?): ByteArray?
    fun signedMessageToKey(data: ByteArray?, signature: ByteArray?): BigInteger?
    fun getAddressFromKey(recoveredKey: BigInteger?): String?
    fun keccak256(message: ByteArray?): ByteArray?
    fun formatTypedMessage(rawData: Array<ProviderTypedData?>?): CharSequence? // see class Utils: Uses Android text formatting
    fun formatEIP721Message(messageData: String?): CharSequence? // see class Utils: Uses web3j: you need to provide this function to decode EIP712.

    // --- Currently web3j uses a different library for Android and Generic Java packages.
    // --- One day web3j could be united, then we can remove these functions
    fun getStructuredData(messageData: String?): ByteArray // see class Utils: Uses web3j
}
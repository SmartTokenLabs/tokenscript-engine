package org.tokenscript.engine.crypto

import org.tokenscript.engine.crypto.XMLDsigVerificationResult

expect object XMLDSigVerifier {

    fun VerifyXMLDSig(bytes: ByteArray): XMLDsigVerificationResult

}
package org.tokenscript.engine.crypto

/**
 * Created by James on 19/04/2019.
 * Stormbird in Sydney
 */
class XMLDsigVerificationResult {
    var isValid = false
    var keyName = ""
    var issuerPrincipal = ""
    var subjectPrincipal = ""
    var keyType = ""
    var failureReason: String? = null
}
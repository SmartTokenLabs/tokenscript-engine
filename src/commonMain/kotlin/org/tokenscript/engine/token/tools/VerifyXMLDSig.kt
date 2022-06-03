package org.tokenscript.engine.token.tools

/*class VerifyXMLDSig {
    //Invoke with Lambda via VerifyXMLDSig interface
    @Throws(Exception::class)
    fun VerifyTSMLFile(req: Request): Response {
        val result: JsonObject = validateSSLCertificate(req.file)
        return Response(result)
    }

    @Throws(java.io.UnsupportedEncodingException::class)
    fun validateSSLCertificate(file: String?): JsonObject {
        val result = JsonObject()
        val stream: java.io.InputStream = java.io.ByteArrayInputStream(file.toByteArray(charset("UTF-8")))
        val XMLDsigVerificationResult: XMLDsigVerificationResult = XMLDSigVerifier().VerifyXMLDSig(stream)
        if (XMLDsigVerificationResult.isValid) {
            result.put("result", "pass")
            result.put("issuer", XMLDsigVerificationResult.issuerPrincipal)
            result.put("subject", XMLDsigVerificationResult.subjectPrincipal)
            result.put("keyName", XMLDsigVerificationResult.keyName)
            result.put("keyType", XMLDsigVerificationResult.keyType)
        } else {
            result.put("result", "fail")
            result.put("failureReason", XMLDsigVerificationResult.failureReason)
        }
        return result
    }

    class Request {
        var file: String? = null

        constructor(file: String?) {
            this.file = file
        }

        constructor() {}
    }

    class Response {
        var result: JsonObject? = null
        fun getResult(): JsonObject? {
            return result
        }

        fun setResult(result: JsonObject?) {
            this.result = result
        }

        constructor(result: JsonObject?) {
            this.result = result
        }

        constructor() {}
    }
}*/
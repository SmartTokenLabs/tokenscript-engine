package org.tokenscript.engine.crypto

import org.w3c.dom.DOMException
import org.w3c.dom.Document
import org.w3c.dom.NodeList
import org.xml.sax.SAXException
import java.io.IOException
import java.security.*
import java.security.cert.*
import java.util.*
import java.util.Arrays.asList
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager
import javax.xml.crypto.KeySelector
import javax.xml.crypto.KeySelectorException
import javax.xml.crypto.XMLStructure
import javax.xml.crypto.AlgorithmMethod
import javax.xml.crypto.KeySelectorResult
import javax.xml.crypto.MarshalException
import javax.xml.crypto.XMLCryptoContext
import javax.xml.crypto.dsig.XMLSignature
import javax.xml.crypto.dsig.XMLSignatureException
import javax.xml.crypto.dsig.XMLSignatureFactory
import javax.xml.crypto.dsig.dom.DOMValidateContext
import javax.xml.crypto.dsig.keyinfo.KeyInfo
import javax.xml.crypto.dsig.keyinfo.KeyName
import javax.xml.crypto.dsig.keyinfo.KeyValue
import javax.xml.crypto.dsig.keyinfo.X509Data
import javax.xml.parsers.DocumentBuilder
import javax.xml.parsers.DocumentBuilderFactory
import javax.xml.parsers.ParserConfigurationException

actual object XMLDSigVerifier {

    actual fun VerifyXMLDSig(bytes: ByteArray): XMLDsigVerificationResult {
        val result = XMLDsigVerificationResult()
        return try {
            //Signature will also be validated in this call, if it fails an exception is thrown
            //No point to validate the certificate is this signature is invalid to begin with
            //And TrustAddressGenerator needs to get an XMLSignature too.
            val signature: XMLSignature = getValidXMLSignature(bytes)
            result.isValid = true //would go to catch if this was not the case
            //check that the tsml file is signed by a valid certificate
            validateCertificateIssuer(signature, result)
        } catch (e: Exception) {
            result.isValid = false
            result.failureReason = e.message
            result
        }
    }

    @Throws(
        ParserConfigurationException::class,
        IOException::class,
        SAXException::class,
        MarshalException::class,
        XMLSignatureException::class,
        DOMException::class
    )

    fun getValidXMLSignature(bytes: ByteArray): XMLSignature {

        val dbFactory: DocumentBuilderFactory = DocumentBuilderFactory.newInstance()
        dbFactory.isNamespaceAware = true
        val dBuilder: DocumentBuilder = dbFactory.newDocumentBuilder()
        val xml: Document = dBuilder.parse(bytes.decodeToString())
        xml.documentElement.normalize()

        // Find Signature element
        val nl: NodeList = xml.getElementsByTagNameNS(XMLSignature.XMLNS, "Signature")
        if (nl.length == 0) {
            throw DOMException(DOMException.INDEX_SIZE_ERR, "Missing elements")
        }

        // Create a DOM XMLSignatureFactory that will be used to unmarshal the
        // document containing the XMLSignature
        val fac: XMLSignatureFactory = XMLSignatureFactory.getInstance("DOM")

        // Create a DOMValidateContext and specify a KeyValue KeySelector
        // and document context
        val valContext = DOMValidateContext(SigningCertSelector(), nl.item(0))

        // unmarshal the XMLSignature
        val signature: XMLSignature = fac.unmarshalXMLSignature(valContext)
        val validSig: Boolean = signature.validate(valContext)
        if (!validSig) {
            throw XMLSignatureException("Invalid XML signature")
        }
        return signature
    }

    @Throws(
        NoSuchAlgorithmException::class,
        KeyStoreException::class,
        InvalidAlgorithmParameterException::class,
        CertificateException::class,
        CertPathValidatorException::class
    )
    private fun validateCertificateChain(certList: List<X509Certificate>) {
        // By default on Oracle JRE, algorithm is PKIX
        val tmf: TrustManagerFactory = TrustManagerFactory
            .getInstance(TrustManagerFactory.getDefaultAlgorithm())
        // 'null' will initialise the tmf with the default CA certs installed
        // with the JRE.
        tmf.init(null as KeyStore?)
        val tm: X509TrustManager = tmf.trustManagers.get(0) as X509TrustManager
        val cpv: CertPathValidator = CertPathValidator.getInstance("PKIX")
        val anch: MutableSet<TrustAnchor> = HashSet<TrustAnchor>()
        for (cert in tm.acceptedIssuers) {
            anch.add(TrustAnchor(cert, null))
        }
        val params: PKIXParameters = PKIXParameters(anch)
        Security.setProperty("ocsp.enable", "true")
        params.isRevocationEnabled = true
        val factory: CertificateFactory = CertificateFactory.getInstance("X.509")
        try {
            cpv.validate(factory.generateCertPath(certList), params)
        } catch (e: CertPathValidatorException) {
            println(e.index)
            //if the timestamp check fails because the cert is expired
            //we allow this to continue (code 0)
            if (e.index != 0) {
                throw e
            }
        }
    }

    private fun findRootCert(certificates: List<X509Certificate>?): X509Certificate? {
        var rootCert: X509Certificate? = null
        if (certificates != null) {
            for (cert in certificates) {
                val signer: X509Certificate? = findSignerCertificate(cert, certificates)
                if (signer == null || signer == cert) {
                    rootCert = cert
                    break
                }
            }
        }
        return rootCert
    }

    private fun reorderCertificateChain(chain: MutableList<X509Certificate>): MutableList<X509Certificate> {
        val reorderedChain: Array<X509Certificate?> = arrayOfNulls(chain.size)
        var position = chain.size - 1
        val rootCert: X509Certificate? = findRootCert(chain)

        if (rootCert == null)
            return chain

        reorderedChain[position] = rootCert
        var cert: X509Certificate? = rootCert
        while (cert?.let { it -> findSignedCert(it, chain).also { cert = it } } != null && position > 0) {
            --position
            reorderedChain[position] = cert
        }
        return asList(*reorderedChain)
    }

    private fun findSignedCert(
        signingCert: X509Certificate,
        certificates: List<X509Certificate>
    ): X509Certificate? {
        var signed: X509Certificate? = null
        for (cert in certificates) {
            val signingCertSubjectDN: Principal = signingCert.getSubjectDN()
            val certIssuerDN: Principal = cert.issuerDN
            if (certIssuerDN == signingCertSubjectDN && cert != signingCert) {
                signed = cert
                break
            }
        }
        return signed
    }

    private fun findSignerCertificate(
        signedCert: X509Certificate,
        certificates: List<X509Certificate>
    ): X509Certificate? {
        var signer: X509Certificate? = null
        for (cert in certificates) {
            val certSubjectDN: Principal = cert.subjectDN
            val issuerDN: Principal = signedCert.issuerDN
            if (certSubjectDN == issuerDN) {
                signer = cert
                break
            }
        }
        return signer
    }

    private fun validateCertificateIssuer(
        signature: XMLSignature,
        result: XMLDsigVerificationResult
    ): XMLDsigVerificationResult {
        try {
            val xmlKeyInfo: KeyInfo? = signature.keyInfo

            if (xmlKeyInfo == null || xmlKeyInfo.content == null)
                throw KeySelectorException("Could not find keyinfo in XML")

            val certList: MutableList<X509Certificate> = getCertificateChainFromXML(xmlKeyInfo.content as MutableList<XMLStructure>?)

            val orderedCerts: List<X509Certificate> = reorderCertificateChain(certList)
            val signingCert: X509Certificate = selectSigningKeyFromXML(xmlKeyInfo.content as MutableList<XMLStructure>)

            //Throws if invalid
            validateCertificateChain(orderedCerts)

            result.issuerPrincipal = signingCert.issuerX500Principal.name
            result.subjectPrincipal = signingCert.subjectX500Principal.name
            result.keyType = signingCert.sigAlgName
            for (o in xmlKeyInfo.content) {
                val xmlStructure: XMLStructure = o as XMLStructure
                if (xmlStructure is KeyName) {
                    result.keyName = xmlStructure.name
                }
            }
        } catch (e: Exception) {
            result.isValid = false
            result.failureReason = e.message
        }
        return result
    }

    @Throws(KeyStoreException::class)
    private fun getCertificateChainFromXML(xmlElements: MutableList<XMLStructure>?): MutableList<X509Certificate> {
        var found = false
        val certs: MutableList<X509Certificate> = mutableListOf()

        if (xmlElements != null) {
            for (i in xmlElements.indices) {
                val xmlStructure: XMLStructure = xmlElements.get(i)
                if (xmlStructure is X509Data) {

                    if (found) throw KeyStoreException("Duplicate X509Data element")
                    found = true
                    for (cert in xmlStructure.content){
                        if (cert is X509Certificate)
                            certs.add(cert)
                    }
                }
            }
        }

        if (!found || certs.size == 0)
            throw KeyStoreException("No certificate chain in XML")

        return certs
    }

    @Throws(KeyStoreException::class)
    private fun recoverPublicKeyFromXML(xmlElements: MutableList<XMLStructure>): PublicKey? {
        var found = false
        var keyVal: PublicKey? = null
        for (i in xmlElements.indices) {
            val xmlStructure: XMLStructure = xmlElements.get(i)
            if (xmlStructure is KeyValue) {
                //should only be one KeyValue
                if (found) throw KeyStoreException("Duplicate Key found")
                found = true
                val kv: KeyValue = xmlStructure
                try {
                    keyVal = kv.publicKey
                } catch (e: KeyException) {
                    e.printStackTrace()
                }
            }
        }
        return keyVal
    }

    @Throws(KeyStoreException::class, CertificateNotYetValidException::class)
    private fun selectSigningKeyFromXML(xmlElements: MutableList<XMLStructure>): X509Certificate {

        val recovered: PublicKey? = recoverPublicKeyFromXML(xmlElements)
        //Certificates from the XML might be in the wrong order
        val certList: List<X509Certificate> = reorderCertificateChain(getCertificateChainFromXML(xmlElements))
        for (crt in certList) {
            try {
                crt.checkValidity()
            } catch (e: CertificateExpiredException) {
                //allow this
                println("Allowing expired cert: " + e.message)
                continue
            }
            if (recovered != null) {
                val certKey: PublicKey = crt.publicKey
                if (Arrays.equals(recovered.encoded, certKey.encoded)) {
                    return crt
                }
            } else if (crt.sigAlgName == "SHA256withECDSA") {
                return crt
            }
        }
        //if non recovered, simply return the first certificate?
        return certList[0]
    }

    private class SigningCertSelector : KeySelector() {
        @Throws(KeySelectorException::class)
        override fun select(
            keyInfo: KeyInfo?,
            purpose: Purpose?,
            method: AlgorithmMethod?,
            context: XMLCryptoContext?
        ): KeySelectorResult {
            if (keyInfo == null) throw KeySelectorException("Null KeyInfo object!")
            var signer: PublicKey? = null
            val list: MutableList<XMLStructure> = keyInfo.content as MutableList<XMLStructure>
            var found = false
            for (o in list) {
                val xmlStructure: XMLStructure = o
                if (xmlStructure is KeyValue) {
                    if (found) throw KeySelectorException("Duplicate KeyValue")
                    found = true
                    val kv: KeyValue = xmlStructure
                    try {
                        signer = kv.publicKey
                    } catch (e: KeyException) {
                        e.printStackTrace()
                    }
                }
            }
            if (signer != null) return SimpleKeySelectorResult(signer)
            var signingCert: X509Certificate? = null
            signingCert = try {
                selectSigningKeyFromXML(list)
            } catch (e: Exception) {
                throw KeySelectorException(e.message)
            }
            return if (signingCert != null) {
                SimpleKeySelectorResult(signingCert.publicKey)
            } else {
                throw KeySelectorException("No KeyValue element found!")
            }
        }
    }

    private class SimpleKeySelectorResult(pk: PublicKey) : KeySelectorResult {
        private val pk: PublicKey

        init {
            this.pk = pk
        }
        override fun getKey(): Key {
            return this.pk
        }
    }

}
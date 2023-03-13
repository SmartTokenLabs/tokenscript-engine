package org.tokenscript.engine.token.tools

import com.ionspin.kotlin.bignum.integer.BigInteger
import io.ktor.utils.io.core.*
//import org.bouncycastle.asn1.x9.X9ECParameters
//import kotlin.jvm.JvmStatic

/***** WARNING *****
 *
 * TrustAddress can be generated without the TokenScript being
 * signed. It's digest is produced in the way "as if tokenscript is
 * signed", therefore please do not add logic like extracting
 * <SignedInfo> from the TokenScript assuming it's signed.
 * - Weiwu
</SignedInfo> */
/*class TrustAddressGenerator {
    /**********************************************************************************
     * For use in Amazon Lambda
     */
    @Throws(Exception::class)
    fun DeriveTrustAddress(req: Request): Response {
        val trust = getTrustAddress(req.contractAddress, req.digest)
        val revoke = getRevokeAddress(req.contractAddress, req.digest)
        return Response(trust, revoke)
    }

    class Request {
        var contractAddress: String? = null
        var digest: String? = null

        constructor(contractAddress: String?, digest: String?) {
            this.contractAddress = contractAddress
            this.digest = digest
        }

        constructor() {}
    }

    class Response {
        var trustAddress: String? = null
        var revokeAddress: String? = null

        constructor(trustAddress: String?, revokeAddress: String?) {
            this.trustAddress = trustAddress
            this.revokeAddress = revokeAddress
        }

        constructor() {}
    }

    companion object {
        private val CURVE_PARAMS: X9ECParameters = CustomNamedCurves.getByName("secp256k1")
        private val CURVE: ECDomainParameters = ECDomainParameters(
            CURVE_PARAMS.getCurve(), CURVE_PARAMS.getG(),
            CURVE_PARAMS.getN(), CURVE_PARAMS.getH()
        )
        val masterPubKey: ByteArray =
            Hex.decode("04f0985bd9dbb6f461adc994a0c12595716a7f4fb2879bfc5155dffec3770096201c13f8314b46db8d8177887f8d95af1f2dd217291ce6ffe9183681186696bbe5")

        @Throws(
            java.security.NoSuchAlgorithmException::class,
            java.security.NoSuchProviderException::class,
            java.security.spec.InvalidKeySpecException::class
        )
        fun getTrustAddress(contractAddress: String?, digest: String?): String {
            return preimageToAddress((contractAddress + "TRUST" + digest).toByteArray())
        }

        @Throws(
            java.security.NoSuchAlgorithmException::class,
            java.security.NoSuchProviderException::class,
            java.security.spec.InvalidKeySpecException::class
        )
        fun getRevokeAddress(contractAddress: String?, digest: String?): String {
            return preimageToAddress((contractAddress + "REVOKE" + digest).toByteArray())
        }

        // this won't make sense at all if you didn't read security.md
        // https://github.com/AlphaWallet/TokenScript/blob/master/doc/security.md
        @Throws(
            java.security.NoSuchAlgorithmException::class,
            java.security.NoSuchProviderException::class,
            java.security.spec.InvalidKeySpecException::class
        )
        fun preimageToAddress(preimage: ByteArray?): String {
            java.security.Security.addProvider(BouncyCastleProvider())

            // get the hash of the preimage text
            val digest: Keccak.Digest256 = Digest256()
            digest.update(preimage)
            val hash: ByteArray = digest.digest()

            // use the hash to derive a new address
            val keyDerivationFactor: BigInteger = BigInteger(Numeric.toHexStringNoPrefix(hash), 16)
            val donatePKPoint: ECPoint = extractPublicKey(decodeKey(masterPubKey))
            val digestPKPoint: ECPoint = donatePKPoint.multiply(keyDerivationFactor)
            return getAddress(digestPKPoint)
        }

        private fun extractPublicKey(ecPublicKey: java.security.interfaces.ECPublicKey): ECPoint {
            val publicPointW: java.security.spec.ECPoint = ecPublicKey.getW()
            val xCoord: BigInteger = publicPointW.getAffineX()
            val yCoord: BigInteger = publicPointW.getAffineY()
            return CURVE.getCurve().createPoint(xCoord, yCoord)
        }

        @Throws(
            java.security.NoSuchAlgorithmException::class,
            java.security.NoSuchProviderException::class,
            java.security.spec.InvalidKeySpecException::class
        )
        private fun decodeKey(encoded: ByteArray): java.security.interfaces.ECPublicKey {
            val params: ECNamedCurveParameterSpec = ECNamedCurveTable.getParameterSpec("secp256k1")
            val fact: java.security.KeyFactory = java.security.KeyFactory.getInstance("ECDSA", "BC")
            val curve: ECCurve = params.getCurve()
            val ellipticCurve: java.security.spec.EllipticCurve = EC5Util.convertCurve(curve, params.getSeed())
            val point: java.security.spec.ECPoint = ECPointUtil.decodePoint(ellipticCurve, encoded)
            val params2: java.security.spec.ECParameterSpec = EC5Util.convertSpec(ellipticCurve, params)
            val keySpec: java.security.spec.ECPublicKeySpec = java.security.spec.ECPublicKeySpec(point, params2)
            return fact.generatePublic(keySpec) as java.security.interfaces.ECPublicKey
        }

        private fun getAddress(pub: ECPoint): String {
            val pubKeyHash: ByteArray = computeAddress(pub)
            return Numeric.toHexString(pubKeyHash)
        }

        private fun computeAddress(pubBytes: ByteArray): ByteArray {
            val digest: Keccak.Digest256 = Digest256()
            digest.update(java.util.Arrays.copyOfRange(pubBytes, 1, pubBytes.size))
            val addressBytes: ByteArray = digest.digest()
            return java.util.Arrays.copyOfRange(addressBytes, 0, 20)
        }

        private fun computeAddress(pubPoint: ECPoint): ByteArray {
            return computeAddress(pubPoint.getEncoded(false))
        }

        /**********************************************************************************
         * For use in Command Console
         */
        @Throws(
            java.security.NoSuchAlgorithmException::class,
            java.security.NoSuchProviderException::class,
            java.security.spec.InvalidKeySpecException::class
        )
        @JvmStatic
        fun main(args: Array<String>) {
            if (args.size == 2) {
                println("Express of Trust Address derived using the following:")
                println("")
                println("\tContract Address: " + args[0])
                println("\tXML Digest for Signature: " + args[1])
                println("")
                println("Are:")
                println("")
                println(
                    "\tTrust Address:\t" + getTrustAddress(
                        args[0], args[1]
                    )
                )
                println(
                    "\tRevoke Address:\t" + getRevokeAddress(
                        args[0], args[1]
                    )
                )
            } else {
                println("This utility generates express-of-trust address and its revocation address\n for a given pair of token contract and TokenScript")
                println("")
                println("Expecting two arguments: contract address and XML digest.")
                println("")
                println("\tExample:")
                println("\tAssuming classpath is set properly,:")
                println("\te.g. if you built the lib project with `gradle shadowJar` and you've set")
                println("\tCLASSPATH=build/libs/lib-all.jar")
                println("\tRun the following:")
                println("")
                println(
                    "$ java " + TrustAddressGenerator::class.java.getCanonicalName() +
                            "0x63cCEF733a093E5Bd773b41C96D3eCE361464942 z+I6NxdALVtlc3TuUo2QEeV9rwyAmKB4UtQWkTLQhpE="
                )
            }
        }
    }
}*/
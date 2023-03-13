package org.tokenscript.engine.token.tools

import com.ionspin.kotlin.bignum.integer.BigInteger
import com.ionspin.kotlin.bignum.integer.toBigInteger
import org.tokenscript.engine.token.entity.*

/**
 * Created by James on 21/02/2018.
 */
/*class ParseMagicLink(cryptInf: CryptoFunctionsInterface, chains: List<ChainSpec?>?) {
    private val cryptoInterface: CryptoFunctionsInterface
    private var extraChains: MutableMap<Long, ChainSpec>? = null

    init {
        cryptoInterface = cryptInf
        if (chains != null) {
            extraChains = HashMap<Long, ChainSpec>()
            for (cs in chains) extraChains!![cs.chainId] = cs
        }
    }

    fun addChain(chain: ChainSpec) {
        if (extraChains == null) extraChains = HashMap<Long, ChainSpec>()
        extraChains!![chain.chainId] = chain
    }

    @Throws(SalesOrderMalformed::class)
    fun readByteMessage(message: ByteArray?, sig: ByteArray?, ticketCount: Int): MessageData {
        val data = MessageData()
        try {
            val ds = EthereumReadBuffer(message)
            data.priceWei = ds.readBI()
            ds.readBI()
            ds.readAddress()
            data.tickets = IntArray(ticketCount)
            ds.readUnsignedShort(data.tickets)

            //java.lang.System.arraycopy(sig, 0, data.signature, 0, 65)
            if (sig != null) {
                data.signature = sig.copyInto(data.signature, 0, 0, 65)
            }

            ds.close()
        } catch (e: java.io.IOException) {
            throw SalesOrderMalformed()
        }
        return data
    }

    /**
     * Universal link's Query String section is formatted like this:
     *
     * AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALyaECakvG8LqLvkhtHQnaVzKznkAKcAqA==;
     * 1b;
     * 2F982B84C635967A9B6306ED5789A7C1919164171E37DCCDF4B59BE547544105;
     * 30818B896B7D240F56C59EBDF209062EE54DA7A3590905739674DCFDCECF3E9B
     *
     * Base64 message: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALyaECakvG8LqLvkhtHQnaVzKznkAKcAqA==
     * - bytes32: price Wei
     * - bytes32: expiry
     * - bytes20: contract address
     * - Uint16[]: ticket indices
     *
     * byte: 1b
     * bytes32: 2F982B84C635967A9B6306ED5789A7C1919164171E37DCCDF4B59BE547544105
     * bytes32: 30818B896B7D240F56C59EBDF209062EE54DA7A3590905739674DCFDCECF3E9B
     *
     */
    @Throws(SalesOrderMalformed::class)
    fun parseUniversalLink(link: String): MagicLinkData {
        var chainId: Long = MagicLinkInfo.identifyChainId(link)
        var magicLinkUrlPrefix: String = MagicLinkInfo.getMagicLinkDomainFromNetworkId(chainId)
        if (chainId == 0L && extraChains != null) {
            chainId = identifyChain(link)
            if (chainId > 0) magicLinkUrlPrefix = extraChains!![chainId]!!.urlPrefix
        }
        if (magicLinkUrlPrefix == null) {
            throw SalesOrderMalformed("Invalid link format")
        }
        var offset = link.indexOf(magicLinkUrlPrefix)
        return if (offset > -1) {
            offset += magicLinkUrlPrefix.length + 1
            val linkData = link.substring(offset)
            getMagicLinkDataFromURL(linkData, chainId)
        } else {
            throw SalesOrderMalformed("Invalid link format")
        }
    }

    private fun identifyChain(link: String): Long {
        val dSlash = link.indexOf("://")
        var chainId: Long = 0
        //split out the chainId from the magiclink
        val index: Int = link.indexOf(mainnetMagicLinkDomain)
        if (index > 0 && dSlash > 0) {
            val domain = link.substring(dSlash + 3, index + mainnetMagicLinkDomain.length())
            for (cs in extraChains!!.values) {
                val prefix: Int = link.indexOf(cs.urlPrefix!!)
                if (prefix > 0) {
                    chainId = cs.chainId
                    break
                }
            }
        }
        return chainId
    }

    @Throws(java.io.IOException::class)
    private fun getDataFromLinks(data: MagicLinkData, ds: EthereumReadBuffer): MagicLinkData {
        val szabo: Long = ds.toUnsignedLong(ds.readInt())
        data.expiry = ds.toUnsignedLong(ds.readInt())
        data.priceWei = Convert.toWei(java.math.BigDecimal.valueOf(szabo), Convert.Unit.SZABO).toBigIntegereger()
        data.contractAddress = ds.readAddress()
        when (data.contractType) {
            spawnable -> {
                data.tokenIds = ds.readTokenIdsFromSpawnableLink(ds.available() - 65)
                data.ticketCount = data.tokenIds.size()
            }
            else -> {
                data.indices = ds.readCompressedIndices(ds.available() - 65)
                data.ticketCount = data.indices.length
            }
        }

        //now read signature
        ds.readSignature(data.signature)
        ds.close()
        //now we have to build the message that the contract is expecting the signature for
        data.message = getTradeBytes(data)
        val microEth: BigInteger =
            Convert.fromWei(java.math.BigDecimal(data.priceWei), Convert.Unit.SZABO).abs().toBigIntegereger()
        data.price = microEth.toDouble() / 1000000.0
        return data
    }

    //Note: currency links handle the unit in szabo directly, no need to parse to wei or vice versa
    @Throws(java.io.IOException::class)
    private fun parseCurrencyLinks(data: MagicLinkData, ds: EthereumReadBuffer): MagicLinkData {
        data.prefix = ds.readBytes(8)
        data.nonce = ds.readBI(4)
        data.amount = ds.readBI(4)
        data.expiry = ds.toUnsignedLong(ds.readInt())
        data.contractAddress = ds.readAddress()
        data.priceWei = BigInteger.ZERO
        data.price = 0
        ds.readSignature(data.signature)
        ds.close()
        //now we have to build the message that the contract is expecting the signature for
        data.message = getTradeBytes(data)
        return data
    }

    @Throws(SalesOrderMalformed::class)
    private fun getMagicLinkDataFromURL(linkData: String, chainId: Long): MagicLinkData {
        val data = MagicLinkData()
        data.chainId = chainId
        return try {
            val fullOrder: ByteArray = cryptoInterface.Base64Decode(linkData)!!
            val ds = EthereumReadBuffer(fullOrder)
            data.contractType = ds.readBytes(1).get(0)
            when (data.contractType) {
                unassigned -> {
                    ds.reset()
                    getDataFromLinks(data, ds)
                }
                normal, spawnable, customizable -> getDataFromLinks(data, ds)
                currencyLink -> parseCurrencyLinks(data, ds)
                else -> getDataFromLinks(data, ds)
            }
        } catch (e: java.lang.Exception) {
            data.chainId = 0
            throw SalesOrderMalformed()
        }
    }

    /**
     * ECRecover the owner address from a sales order
     *
     * @return string address of the owner
     */
    fun getOwnerKey(data: MagicLinkData): String {
        data.ownerAddress = "0x"
        try {
            val recoveredKey: BigInteger = cryptoInterface.signedMessageToKey(data.message, data.signature)
            data.ownerAddress += cryptoInterface.getAddressFromKey(recoveredKey)
        } catch (e: java.lang.Exception) {
            e.printStackTrace()
        }
        return data.ownerAddress
    }

    private fun getTradeBytes(data: MagicLinkData): ByteArray? {
        return when (data.contractType) {
            unassigned, normal, customizable -> getTradeBytes(
                data.indices,
                data.contractAddress!!,
                data.priceWei,
                data.expiry
            )
            spawnable -> getSpawnableBytes(
                data.tokenIds!!,
                data.contractAddress!!,
                data.priceWei,
                data.expiry
            )
            currencyLink -> getCurrencyBytes(
                data.contractAddress,
                data.amount,
                data.expiry,
                data.nonce.longValue()
            ) //data.formCurrencyDropLinkMessage();
            else -> getTradeBytes(data.indices, data.contractAddress!!, data.priceWei, data.expiry)
        }
    }

    fun getSpawnableBytes(
        tokenIds: List<BigInteger?>,
        contractAddress: String,
        priceWei: BigInteger,
        expiry: Long
    ): ByteArray? {
        return try {
            //form the transaction we need to push to buy
            //trade bytes
            val buffer: java.io.ByteArrayOutputStream = java.io.ByteArrayOutputStream()
            val ds: java.io.DataOutputStream = java.io.DataOutputStream(buffer)
            val expiryUL = expiry.toULong()
            val addrBI = BigInteger.parseString(Numeric.cleanHexPrefix(contractAddress), 16)
            ds.write(Numeric.toBytesPadded(priceWei, 32))
            ds.write(Numeric.toBytesPadded(expiryUL.toBigInteger(), 32))
            ds.write(Numeric.toBytesPadded(addrBI, 20))
            for (tokenId in tokenIds) {
                ds.write(Numeric.toBytesPadded(tokenId, 32))
            }
            ds.flush()
            ds.close()
            buffer.toByteArray()
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun getTradeBytes(
        ticketSendIndexList: IntArray,
        contractAddress: String,
        priceWei: BigInteger,
        expiry: Long
    ): ByteArray? {
        return try {
            //form the transaction we need to push to buy
            //trade bytes
            val buffer: java.io.ByteArrayOutputStream = java.io.ByteArrayOutputStream()
            val ds: java.io.DataOutputStream = java.io.DataOutputStream(buffer)
            val expiryUL: ULong = expiry.toULong()
            val addrBI: BigInteger = BigInteger.parseString(Numeric.cleanHexPrefix(contractAddress), 16)
            ds.write(Numeric.toBytesPadded(priceWei, 32))
            ds.write(Numeric.toBytesPadded(BigInteger.fromULong(expiryUL), 32))
            ds.write(Numeric.toBytesPadded(addrBI, 20))
            val uint16 = ByteArray(2)
            for (i in ticketSendIndexList) {
                //write big endian encoding
                uint16[0] = (i shr 8).toByte()
                uint16[1] = (i and 0xFF).toByte()
                ds.write(uint16)
            }
            ds.flush()
            ds.close()
            buffer.toByteArray()
        } catch (e: java.io.IOException) {
            e.printStackTrace()
            null
        }
    }

    fun getCurrencyBytes(
        contractAddress: String?,
        szaboAmount: BigInteger?,
        expiry: Long,
        nonce: Long
    ): ByteArray? {
        return try {
            val buffer: java.io.ByteArrayOutputStream = java.io.ByteArrayOutputStream()
            val wb = EthereumWriteBuffer(buffer)
            wb.write(CURRENCY_LINK_PREFIX.toByteArray())
            wb.writeUnsigned4(nonce)
            wb.writeUnsigned4(szaboAmount)
            wb.writeUnsigned4(expiry)
            wb.writeAddress(contractAddress)
            wb.flush()
            wb.close()
            buffer.toByteArray()
        } catch (e: java.lang.Exception) {
            e.printStackTrace()
            null
        }
    }

    @Throws(SalesOrderMalformed::class)
    fun generateUniversalLink(
        thisTickets: IntArray?,
        contractAddr: String?,
        price: BigInteger,
        expiry: Long,
        signature: ByteArray,
        chainId: Long
    ): String {
        val leading = generateLeadingLinkBytes(thisTickets, contractAddr, price, expiry)
        return completeUniversalLink(chainId, leading, signature)
    }

    fun completeUniversalLink(chainId: Long, message: ByteArray?, signature: ByteArray): String {
        val completeLink = ByteArray(message!!.size + signature.size)
        java.lang.System.arraycopy(message, 0, completeLink, 0, message.size)
        java.lang.System.arraycopy(signature, 0, completeLink, message.size, signature.size)
        val magiclinkPrefix: String
        magiclinkPrefix = if (extraChains != null && extraChains!!.containsKey(chainId)) {
            extraChains!![chainId]!!.urlPrefix!!
        } else {
            MagicLinkInfo.generatePrefix(chainId)
        }
        val sb: StringBuilder = StringBuilder()
        sb.append(magiclinkPrefix)
        val b64: ByteArray = cryptoInterface.Base64Encode(completeLink)!!
        sb.append(String(b64))
        //this trade can be claimed by anyone who pushes the transaction through and has the sig
        return sb.toString()
    }

    companion object {
        private val maxPrice: BigInteger = Convert.toWei(
            java.math.BigDecimal.valueOf(0xFFFFFFFFL),
            Convert.Unit.SZABO
        ).toBigIntegereger()

        //link formats
        const val unassigned: Byte = 0x00
        const val normal: Byte = 0x01
        const val spawnable: Byte = 0x02
        const val customizable: Byte = 0x03
        const val currencyLink: Byte = 0x04
        private const val CURRENCY_LINK_PREFIX = "XDAIDROP"

        /**
         * Generates the first part of a Universal Link transfer message. Contains:
         * 4 Byte Micro Eth value ("Szabo")
         * 4 byte Unsigned expiry value
         * 20 byte address
         * variable length compressed indices (1 byte for 0-127, 2 bytes for 128-32767)
         *
         * @param ticketSendIndexList list of ticket indices
         * @param contractAddress Contract Address
         * @param priceWei Price of bundle in Wei
         * @param expiry Unsigned UNIX timestamp of offer expiry
         * @return First part of Universal Link (requires signature of trade bytes to be added)
         */
        @Throws(SalesOrderMalformed::class)
        private fun generateLeadingLinkBytes(
            type: Byte,
            ticketSendIndexList: IntArray?,
            tokenIds: List<BigInteger>?,
            contractAddress: String?,
            priceWei: BigInteger,
            expiry: Long
        ): ByteArray? {
            return try {
                val buffer: java.io.ByteArrayOutputStream = java.io.ByteArrayOutputStream()
                val wb = EthereumWriteBuffer(buffer)
                wb.writeByte(type)
                if (priceWei.compareTo(maxPrice) > 0) {
                    throw SalesOrderMalformed("Order's price too high to be used in a link")
                }
                wb.write4ByteMicroEth(priceWei)
                wb.writeUnsigned4(expiry)
                wb.writeAddress(contractAddress)
                when (type) {
                    spawnable -> wb.writeTokenIds(tokenIds!!)
                    else -> wb.writeCompressedIndices(ticketSendIndexList!!)
                }
                wb.flush()
                wb.close()
                buffer.toByteArray()
            } catch (e: java.io.IOException) {
                e.printStackTrace()
                null
            }
        }

        fun generateCurrencyLink(currencyBytes: ByteArray?): ByteArray? {
            return try {
                val buffer: java.io.ByteArrayOutputStream = java.io.ByteArrayOutputStream()
                val wb = EthereumWriteBuffer(buffer)
                wb.writeByte(currencyLink)
                wb.write(currencyBytes)
                wb.flush()
                wb.close()
                buffer.toByteArray()
            } catch (e: java.io.IOException) {
                e.printStackTrace()
                null
            }
        }

        @Throws(SalesOrderMalformed::class)
        fun generateLeadingLinkBytes(
            ticketSendIndexList: IntArray?,
            contractAddress: String?,
            priceWei: BigInteger,
            expiry: Long
        ): ByteArray? {
            return generateLeadingLinkBytes(normal, ticketSendIndexList, null, contractAddress, priceWei, expiry)
        }

        @Throws(SalesOrderMalformed::class)
        fun generateSpawnableLeadingLinkBytes(
            tokenIds: List<BigInteger>?,
            contractAddress: String?,
            priceWei: BigInteger,
            expiry: Long
        ): ByteArray? {
            return generateLeadingLinkBytes(spawnable, null, tokenIds, contractAddress, priceWei, expiry)
        }
    }
}*/
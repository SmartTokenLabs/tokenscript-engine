package org.tokenscript.engine.token.entity

import com.ionspin.kotlin.bignum.integer.BigInteger
import com.soywiz.krypto.HasherFactory
import com.soywiz.krypto.MD5
import io.ktor.utils.io.core.*

/**
 * Created by JB on 21/03/2020.
 */
class EventDefinition {
    var contract: ContractInfo? = null
    var attributeName //TransactionResult: method
            : String? = null
    var type: NamedType? = null
    var filter: String? = null
    var select: String? = null
    var readBlock: BigInteger = BigInteger.ZERO
    var parentAttribute: Attribute? = null
    var activityName: String? = null

    // This regex splits up the "filterArgName=${filterValue}" directive and gets the 'filterValue'
    val filterTopicValue: String?
        get() {
            // This regex splits up the "filterArgName=${filterValue}" directive and gets the 'filterValue'
            val m = Regex("\\$\\{([^}]+)\\}")
            val match = filter?.let { m.find(it) }
            return if (match != null  && match.groups.size >= 1) match.groups[1]?.value else null
        }

    // Get the filter name from the directive and strip whitespace
    val filterTopicIndex: String
        get() {
            // Get the filter name from the directive and strip whitespace
            val item = filter!!.split("=".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
            return item[0].replace("\\s+".toRegex(), "")
        }

    fun getTopicIndex(filterTopic: String?): Int {
        return if (type == null || filterTopic == null) -1 else type!!.getTopicIndex(filterTopic)
    }

    fun getSelectIndex(indexed: Boolean): Int {
        var index = 0
        var found = false
        for (label in type!!.getArgNames(indexed)) {
            if (label == select) {
                found = true
                break
            } else {
                index++
            }
        }
        return if (found) index else -1
    }

    val eventChainId: Long
        get() = (parentAttribute?.originContract?.addresses?.keys?.iterator()?.next()
            ?: contract?.addresses?.keys?.iterator()?.next()) as Long

    val eventContractAddress: String
        get() {
            val chainId = eventChainId
            val contractAddress: String
            contractAddress = (parentAttribute?.originContract?.addresses?.get(chainId)?.get(0)
                ?: contract?.addresses?.get(chainId)?.get(0)) as String
            return contractAddress
        }

    fun getNonIndexedIndex(name: String?): Int {
        return if (type == null || name == null) -1 else type!!.getNonIndexedIndex(name)
    }

    fun equals(ev: EventDefinition): Boolean {

        if (ev.contract == null || contract == null)
            return false;

        return contract!!.getfirstChainId() == ev.contract!!.getfirstChainId() &&
                contract!!.firstAddress.lowercase() == ev.contract!!.firstAddress.lowercase() &&
                filter == ev.filter &&
                type!!.name == ev.type!!.name &&
            (
                (activityName != null && ev.activityName != null && activityName == ev.activityName) ||
                (attributeName != null && ev.attributeName != null && attributeName == ev.attributeName)
            )
    }

    val eventKey: String
        get() = if (contract != null) getEventKey(contract!!.getfirstChainId(), contract!!.firstAddress, activityName, attributeName) else ""

    companion object {
        fun getEventKey(chainId: Long, eventAddress: String, activityName: String?, attributeName: String?): String {

            val sb = StringBuilder()

            val digest = MD5()
            digest.update(longToByteArray(chainId))
            digest.update(eventAddress.toByteArray())
            if (activityName != null) digest.update(activityName.toByteArray())
            if (attributeName != null) digest.update(attributeName.toByteArray())

            val bytes: ByteArray = digest.digest().bytes
            for (aByte in bytes) {
                sb.append(((aByte.toInt() and 0xff) + 0x100).toString(16).substring(1))
            }

            return sb.toString()
        }

        private fun intToByteArray(a: Int): ByteArray {
            val ret = ByteArray(4)
            ret[3] = (a and 0xFF).toByte()
            ret[2] = (a shr 8 and 0xFF).toByte()
            ret[1] = (a shr 16 and 0xFF).toByte()
            ret[0] = (a shr 24 and 0xFF).toByte()
            return ret
        }

        private fun longToByteArray(a: Long): ByteArray {
            val ret = ByteArray(8)
            ret[7] = (a and 0xFFL).toByte()
            ret[6] = (a shr 8 and 0xFFL).toByte()
            ret[5] = (a shr 16 and 0xFFL).toByte()
            ret[4] = (a shr 24 and 0xFFL).toByte()
            ret[3] = (a shr 32 and 0xFFL).toByte()
            ret[2] = (a shr 40 and 0xFFL).toByte()
            ret[1] = (a shr 48 and 0xFFL).toByte()
            ret[0] = (a shr 56 and 0xFFL).toByte()
            return ret
        }
    }
}
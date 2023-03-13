package org.tokenscript.engine.token.entity

/**
 * Created by James on 28/05/2019.
 * Stormbird in Sydney
 */
class TokenscriptElement {
    var localRef: String? = null
    var ref: String? = null
    var value: String? = null
    val isToken: Boolean
        get() = ref != null && ref!!.contains("tokenId")
    val tokenIndex: Int
        get() {
            var index = -1
            if (isToken) {
                try {
                    val split = ref!!.split("[\\[\\]]".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
                    if (split.size == 2) {
                        val indexStr = split[1]
                        index = indexStr.toInt()
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
            return index
        }
}
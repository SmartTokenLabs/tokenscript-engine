package org.tokenscript.engine

import kotlin.math.pow
import kotlin.math.roundToInt

@OptIn(ExperimentalUnsignedTypes::class)
fun ByteArray.toHexString() = asUByteArray().joinToString("") { it.toString(16).padStart(2, '0') }

fun String.hexToAscii(): String {
    val output = StringBuilder("")
    var i = 0
    while (i < length) {
        val str = substring(i, i + 2)
        output.append(str.toInt(16).toChar())
        i += 2
    }
    return output.toString()
}

fun Double.toString(numOfDec: Int): String {
    val integerDigits = this.toInt()
    val floatDigits = ((this - integerDigits) * 10f.pow(numOfDec)).roundToInt()
    return "${integerDigits}.${floatDigits}"
}
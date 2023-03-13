package org.tokenscript.engine.token.tools

import com.ionspin.kotlin.bignum.decimal.BigDecimal
import com.ionspin.kotlin.bignum.decimal.DecimalMode
import com.ionspin.kotlin.bignum.decimal.RoundingMode
import com.ionspin.kotlin.bignum.integer.BigInteger
import kotlin.math.pow

/**
 * Ethereum unit conversion functions.
 */
object Convert {
    fun fromWei(number: String?, unit: Unit): BigDecimal? {
        if (number == null)
            return null

        return fromWei(BigDecimal.parseString(number), unit)
    }

    fun fromWei(number: BigDecimal, unit: Unit): BigDecimal {
        return number.divide(unit.getWeiFactor())
    }

    fun toWei(number: String?, unit: Unit): BigDecimal? {
        if (number == null)
            return null

        return toWei(BigDecimal.parseString(number), unit)
    }

    fun toWei(number: BigDecimal, unit: Unit): BigDecimal {
        return number.multiply(unit.getWeiFactor())
    }

    fun getEthString(ethPrice: Double): String {
        val bd = BigDecimal.fromDouble(ethPrice)
        return bd.roundToDigitPositionAfterDecimalPoint(5,  RoundingMode.CEILING).toString()
    }

    fun getEthString(ethFiatValue: Double, decimals: Int): String {
        val bd = BigDecimal.fromDouble(ethFiatValue, DecimalMode(decimals.toLong(), RoundingMode.CEILING))
        return bd.roundToDigitPositionAfterDecimalPoint(5,  RoundingMode.CEILING).toString()
    }

    fun getConvertedValue(rawValue: BigDecimal, divisor: Int): String {
        val convertedValue: BigDecimal = rawValue.divide(BigDecimal.fromDouble(10.0.pow(divisor.toDouble())))
        return convertedValue.roundToDigitPositionAfterDecimalPoint(5,  RoundingMode.CEILING).toString()
    }

    fun getEthStringSzabo(szabo: BigInteger): String? {
        val ethPrice: BigDecimal = fromWei(toWei(BigDecimal.fromBigInteger(szabo), Unit.SZABO), Unit.ETHER)
        return ethPrice.roundToDigitPositionAfterDecimalPoint(5,  RoundingMode.CEILING).toString()
    }

    enum class Unit(factor: Int) {
        
        WEI(0),
        KWEI(3),
        MWEI(6), 
        GWEI(9), 
        SZABO(12), 
        FINNEY(15),
        
        ETHER(18), 
        KETHER(21), 
        METHER( 24), 
        GETHER(27);

        private val weiFactor: BigDecimal
        val factor: Int

        init {
            weiFactor = BigDecimal.TEN.pow(factor)
            this.factor = factor
        }

        fun getWeiFactor(): BigDecimal {
            return weiFactor
        }

        override fun toString(): String {
            return name
        }

        companion object {
            fun fromString(name: String?): Unit {
                if (name != null) {
                    for (unit in values()) {
                        if (name.equals(unit.name, ignoreCase = true)) {
                            return unit
                        }
                    }
                }
                return valueOf(name!!)
            }
        }
    }
}
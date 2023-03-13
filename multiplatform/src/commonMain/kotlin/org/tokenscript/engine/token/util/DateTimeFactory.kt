package org.tokenscript.engine.token.util

import com.soywiz.klock.DateTime
import com.soywiz.klock.DateTimeTz
import com.soywiz.klock.TimezoneNames
import com.soywiz.klock.TimezoneOffset
import com.soywiz.klock.locale.ExtendedTimezoneNames
import kotlinx.datetime.Clock
import org.tokenscript.engine.token.entity.NonFungibleToken



/**
 * Created by James on 11/02/2019.
 * Stormbird in Singapore
 */
object DateTimeFactory {
    fun getDateTime(unixTime: Long): DateTimeTz {
        return DateTimeTz.fromUnix(unixTime).toOffset(TimezoneOffset(0.0))
    }

    fun getDateTime(timeAttr: NonFungibleToken.Attribute): DateTimeTz {

        if (timeAttr.text != null) {
            //there was a specific timezone set in the XML definition file, use this
            return getDateTime(timeAttr.text!!)
        } else {
            //No timezone specified, assume time in GMT
            return this.getDateTime(timeAttr.value.longValue())
        }
    }

    fun getDateTime(time: String): DateTimeTz {
        return DateTime.parse(time)
    }

    fun getCurrentTime(): DateTimeTz{
        return getDateTime(Clock.System.now().epochSeconds)
    }
}
package org.tokenscript.engine.api

import org.tokenscript.engine.OpenSeaTokenData
import kotlin.js.Promise

/**
 * Provides promise-wrapped functions until suspend functions are exportable to Javascript
 */
interface TokenApiJsInterface {

    fun testHttpAsync(): Promise<OpenSeaTokenData>
}
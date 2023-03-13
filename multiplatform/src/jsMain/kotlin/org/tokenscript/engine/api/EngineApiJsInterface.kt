package org.tokenscript.engine.api

import org.tokenscript.engine.TSToken
import kotlin.js.Promise

/**
 * Provides promise-wrapped functions until suspend functions are exportable to Javascript
 */
interface EngineApiJsInterface {

    fun getTokenScriptAsync(tsId: String): Promise<TSToken>
}
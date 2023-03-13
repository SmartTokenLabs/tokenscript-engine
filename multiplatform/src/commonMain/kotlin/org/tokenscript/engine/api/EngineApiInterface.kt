package org.tokenscript.engine.api

import org.tokenscript.engine.TSToken

/**
 *  Each function has one suspend and one callback version - additionally the javascript interface has a promise-wrapped
 *  version that can be found in EngineApiJsInterface. This will be removed once suspended functions can be exported to javascript.
 */
interface EngineApiInterface {

    suspend fun getTokenScript(tsId: String) : TSToken

    fun getTokenScript(tsId: String, onSuccess: (tokenApi: TSToken) -> Unit, onError: (error: String) -> Unit)
}
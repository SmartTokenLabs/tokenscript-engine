package org.tokenscript.engine.api

import org.tokenscript.engine.OpenSeaTokenData

/**
 *  Each function has one suspend and one callback version - additionally the javascript interface has a promise-wrapped
 *  version that can be found in TokenApiJsInterface. This will be removed once suspended functions can be exported to javascript.
 */
interface TokenApiInterface {

    suspend fun testHttp(): OpenSeaTokenData

    fun testHttp(onSuccess: (data: OpenSeaTokenData) -> Unit, onError: (error: String) -> Unit)
}
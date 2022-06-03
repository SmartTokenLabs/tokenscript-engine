package org.tokenscript.engine.api

import kotlinx.coroutines.*
import org.tokenscript.engine.OpenSeaTokenData
import org.tokenscript.engine.TSToken
import org.tokenscript.engine.TestHttp
import org.tokenscript.engine.token.tools.TokenDefinition

open class TokenApiBase(val tokenMeta:TokenDefinition) {

    suspend fun testHttp(): OpenSeaTokenData {
        return TestHttp.getJsonDataClass()
    }

    fun testHttp(onSuccess: (data: OpenSeaTokenData) -> Unit, onError: (error: String) -> Unit){
        try {
            CoroutineScope(Dispatchers.Default).launch {
                onSuccess(testHttp());
            }
        } catch (err: Error){
            onError(err.message!!);
        }
    }
}
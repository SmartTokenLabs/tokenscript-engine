package org.tokenscript.engine.api

import kotlinx.coroutines.*
import org.tokenscript.engine.OpenSeaTokenData
import org.tokenscript.engine.TSToken
import org.tokenscript.engine.TestHttp
import org.tokenscript.engine.token.tools.TokenDefinition

open class TokenApiBase(val tokenMeta:TokenDefinition): TokenApiInterface {

    override suspend fun testHttp(): OpenSeaTokenData {
        println("Performing test HTTP call")

        return TestHttp.getJsonDataClass()
    }

    override fun testHttp(onSuccess: (data: OpenSeaTokenData) -> Unit, onError: (error: String) -> Unit){
        try {
            CoroutineScope(Dispatchers.Default).launch {
                onSuccess(testHttp());
            }
        } catch (err: Error){
            onError(err.message!!);
        }
    }
}
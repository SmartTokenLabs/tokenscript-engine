package org.tokenscript.engine.api

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.tokenscript.engine.OpenSeaTokenData
import org.tokenscript.engine.TSToken
import org.tokenscript.engine.TestHttp
import org.tokenscript.engine.repo.TSRepo
import kotlin.native.concurrent.ThreadLocal

@ThreadLocal
open class EngineApiBase {

    private val tokens: HashMap<String, TSToken> = HashMap();

    suspend fun getTokenScript(tsId: String) : TSToken {

        if (tokens.containsKey(tsId))
            return tokens.get(tsId)!!

        val token: TSToken? = loadTokenScript(tsId)

        if (token == null)
            throw Exception("Could not load tokenscript")

        tokens.put(tsId, token)

        return token;
    }

    fun getTokenScript(tsId: String, onSuccess: (tokenApi: TSToken) -> Unit, onError: (error: String) -> Unit){
        try {
            CoroutineScope(Dispatchers.Default).launch {
                onSuccess(getTokenScript(tsId));
            }
        } catch (err: Error){
            onError(err.message!!);
        }
    }

    private suspend fun loadTokenScript(tsId: String): TSToken? {
        val tokenDef = TSRepo.getTokenDefinition(tsId);

        if (tokenDef != null)
            return TSToken(tokenDef)

        return null
    }
}
package org.tokenscript.engine.api

import DefaultDefinitionStorage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.tokenscript.engine.OpenSeaTokenData
import org.tokenscript.engine.TSToken
import org.tokenscript.engine.TestHttp
import org.tokenscript.engine.repo.TSRepo
import org.tokenscript.engine.storage.DefinitionStorageInterface
import kotlin.native.concurrent.ThreadLocal

@ThreadLocal
open class EngineApiBase(val basePath: String): EngineApiInterface {

    var defStorageProvider: DefinitionStorageInterface = DefaultDefinitionStorage(basePath)
    var repo: TSRepo = TSRepo(this.defStorageProvider)

    private val tokens: HashMap<String, TSToken> = HashMap();

    override suspend fun getTokenScript(tsId: String) : TSToken {

        if (tokens.containsKey(tsId))
            return tokens.get(tsId)!!

        val token: TSToken = loadTokenScript(tsId)

        tokens.put(tsId, token)

        return token;
    }

    override fun getTokenScript(tsId: String, onSuccess: (tokenApi: TSToken) -> Unit, onError: (error: String) -> Unit){
        try {
            CoroutineScope(Dispatchers.Default).launch {
                onSuccess(getTokenScript(tsId));
            }
        } catch (err: Error){
            onError(err.message!!);
        }
    }

    private suspend fun loadTokenScript(tsId: String): TSToken {

        println("Loading token API")

        val tokenDef = repo.getTokenDefinition(tsId);

        println(tokenDef)

        return TSToken(tokenDef)
    }
}
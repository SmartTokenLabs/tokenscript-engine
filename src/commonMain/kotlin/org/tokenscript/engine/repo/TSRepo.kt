package org.tokenscript.engine.repo

import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.utils.io.core.*
import org.tokenscript.engine.token.entity.ParseResult
import org.tokenscript.engine.token.tools.TokenDefinition
import org.tokenscript.engine.repo.sources.ScriptURI
import org.tokenscript.engine.repo.sources.TSSourceInterface
import org.tokenscript.engine.repo.sources.TokenscriptOrg

object TSRepo: ParseResult {

    val sources: List<TSSourceInterface> = listOf(TokenscriptOrg, ScriptURI);

    val tokens: HashMap<String, TokenDefinition> = HashMap()

    suspend fun getTokenDefinition(tsId: String): TokenDefinition? {

        if (tokens.containsKey(tsId))
            return tokens.get(tsId)


        val tsFile = downloadTokenFile(tsId)

        if (tsFile == null)
            return null

        val tokenDefinition = TokenDefinition(tsFile.toByteArray(), result = this)

        tokens.put(tsId, tokenDefinition)

        return tokenDefinition
    }

    suspend fun downloadTokenFile(tsId: String) : String? {

        val httpClient = HttpClient()

        try {
            return httpClient.get(TokenDefinition.TOKENSCRIPT_REPO_SERVER + TokenDefinition.TOKENSCRIPT_CURRENT_SCHEMA + "/" + tsId) {
                //this.header("Accept", "application/tokenscript+xml")
            }
        } catch (e: Exception){
            println(e.message)
        }

        return null
    }

    fun resolveFile(){

        for (source in sources){


        }

    }

    override fun parseMessage(parseResult: ParseResult.ParseResultId?) {

    }
}
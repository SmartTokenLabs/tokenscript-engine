package org.tokenscript.engine.repo

import io.ktor.utils.io.core.*
import org.tokenscript.engine.token.entity.ParseResult
import org.tokenscript.engine.token.tools.TokenDefinition
import org.tokenscript.engine.repo.sources.ScriptURI
import org.tokenscript.engine.repo.sources.TSSourceInterface
import org.tokenscript.engine.repo.sources.TokenscriptOrg
import org.tokenscript.engine.storage.DefinitionStorageInterface

class TSRepo(val storage: DefinitionStorageInterface? = null): ParseResult {

    val sources: List<TSSourceInterface> = listOf(TokenscriptOrg, ScriptURI)

    suspend fun getTokenDefinition(tsId: String): TokenDefinition {

        if (storage != null) {
            try {
                return loadFromStorage(tsId)
            } catch (e: Exception) {
                println(e.message)
            }
        }

        try {
            return resolveTokenscript(tsId)
        } catch (e: Exception){
            println(e.message)
            throw e
        }
    }

    fun loadFromStorage(tsId: String): TokenDefinition {

        val tsFile: String = storage?.readDefinition(tsId) ?: throw Exception("Definition is not available in storage")

        return TokenDefinition(tsFile.toByteArray(), result = this)
    }

    suspend fun resolveTokenscript(tsId: String): TokenDefinition {

        for (source in sources){

            try {
                val tsFile = source.getTokenscriptXml(tsId)

                val token = TokenDefinition(tsFile.toByteArray(), result = this)

                storage?.writeDefinition(tsId, tsFile)

                return token
            } catch (e: Exception){
                println("Failed to resolve using " + source::class)
            }

        }

        throw Exception("Could not resolve token definition");
    }

    override fun parseMessage(parseResult: ParseResult.ParseResultId?) {

    }
}
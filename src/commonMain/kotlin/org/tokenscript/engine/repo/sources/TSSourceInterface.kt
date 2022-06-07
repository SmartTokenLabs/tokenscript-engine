package org.tokenscript.engine.repo.sources

interface TSSourceInterface {
    suspend fun getTokenscriptXml(contract: String): String
}
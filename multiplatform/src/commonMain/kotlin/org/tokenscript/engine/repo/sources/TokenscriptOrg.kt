package org.tokenscript.engine.repo.sources

import io.ktor.client.*
import io.ktor.client.request.*
import org.tokenscript.engine.token.tools.TokenDefinition

object TokenscriptOrg: TSSourceInterface {

    override suspend fun getTokenscriptXml(contract: String): String {

        val httpClient = HttpClient()

        return httpClient.get(TokenDefinition.TOKENSCRIPT_REPO_SERVER + TokenDefinition.TOKENSCRIPT_CURRENT_SCHEMA + "/" + contract) {
            //this.header("Accept", "application/tokenscript+xml")
        }
    }
}
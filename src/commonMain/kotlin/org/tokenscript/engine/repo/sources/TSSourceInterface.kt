package org.tokenscript.engine.repo.sources

interface TSSourceInterface {
    fun getTokenscriptXml(contract: String): String
}
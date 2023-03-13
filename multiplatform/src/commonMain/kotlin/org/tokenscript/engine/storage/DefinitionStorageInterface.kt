package org.tokenscript.engine.storage

interface DefinitionStorageInterface {

    fun readDefinition(tsId: String): String?

    fun writeDefinition(tsId: String, data: String)
}
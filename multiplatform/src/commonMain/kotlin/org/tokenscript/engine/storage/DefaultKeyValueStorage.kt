package org.tokenscript.engine.storage

/**
 * A default storage adapter implementation for all platforms
 * It provides localStorage backend in the browser and file backend in all other platforms
 */

expect open class DefaultKeyValueStorage(basePath: String, extension: String) {

    fun readValue(path: String): String?

    fun writeValue(path: String, value: String)

    fun removeValue(path: String)

    // TODO: This should take a group string to match against entries
    fun clearAll()
}
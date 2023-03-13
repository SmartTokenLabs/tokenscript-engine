package org.tokenscript.engine.storage

import platform.Foundation.*

actual open class DefaultKeyValueStorage actual constructor(private val basePath: String, private val extension: String) {

    // TODO: Create nested directories like the Java implementation
    actual fun readValue(path: String): String? {

        val paths = getPaths(path)

        return NSString.stringWithContentsOfFile(path[0] + "/" + path[1], NSUTF8StringEncoding, null)
    }

    actual fun writeValue(path: String, value: String){

        val paths = getPaths(path)

        createDirectories(paths[0])

        val res = (value as NSString).writeToFile(path[0] + "/" + path[1], true, NSUTF8StringEncoding, null)

        println("File written: " + res)
    }

    private fun getPaths(path: String): List<String> {
        val lastSlash = path.lastIndexOf("/")
        val directories = path.substring(0, lastSlash)
        val filename = path.substring(lastSlash + 1)

        val dirPath = basePath + "/" + directories

        return listOf(dirPath, filename + "." + extension)
    }

    private fun createDirectories(dirPath: String) {

        if (!NSFileManager.defaultManager().fileExistsAtPath(dirPath)){
            try {
                val url = NSURL.URLWithString(dirPath)
                NSFileManager.defaultManager().createDirectoryAtURL(url!!, true, null, null)
            } catch (e: Exception){
                println("Failed to create directories: " + e.message)
                throw e
            }
        }
    }

    actual fun removeValue(path: String){
        TODO("Not yet implemented")
    }

    actual fun clearAll(){
        TODO("Not yet implemented")
    }
}
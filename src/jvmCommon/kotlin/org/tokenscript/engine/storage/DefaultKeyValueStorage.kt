package org.tokenscript.engine.storage

import java.io.File

actual open class DefaultKeyValueStorage actual constructor(val basePath: String, val extension: String) {

    actual fun readValue(path: String): String? {
        return String(getFile(path).readBytes())
    }

    actual fun writeValue(path: String, value: String){
        getFile(path).writeText(value)
    }

    actual fun removeValue(path: String){
        getFile(path).delete()
    }

    actual fun clearAll(){
        TODO("Not yet implemented")
    }

    private fun getFile(path: String): File {

        val lastSlash = path.lastIndexOf("/")
        val directories = path.substring(0, lastSlash)
        val filename = path.substring(lastSlash + 1)

        val filePath = File(basePath + "/" + directories)

        if (!filePath.exists())
            filePath.mkdirs()

        return File(filePath, "$filename.$extension")
    }
}
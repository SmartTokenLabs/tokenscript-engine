package org.tokenscript.engine.storage

import platform.Foundation.NSString
import platform.Foundation.NSUTF8StringEncoding
import platform.Foundation.stringWithContentsOfFile
import platform.Foundation.writeToFile

actual open class DefaultKeyValueStorage actual constructor(private val basePath: String, private val extension: String) {

    // TODO: Create nested directories like the Java implementation
    actual fun readValue(path: String): String? {
        return NSString.stringWithContentsOfFile(path, NSUTF8StringEncoding, null) ?: return null
    }

    actual fun writeValue(path: String, value: String){
        (value as NSString).writeToFile(basePath + "/" + path + "." + extension, true, NSUTF8StringEncoding, null)
    }

    actual fun removeValue(path: String){
        TODO("Not yet implemented")
    }

    actual fun clearAll(){
        TODO("Not yet implemented")
    }
}
package org.tokenscript.engine.storage

actual open class DefaultKeyValueStorage actual constructor(basePath: String, extension: String) {

    actual fun readValue(path: String): String? {
        TODO("Not yet implemented")
        return NSString.stringWithContentsOfFile(path, NSUTF8StringEncoding, null) ?: return null
    }

    actual fun writeValue(path: String, value: String){
        TODO("Not yet implemented")
        return (value as NSString).writeToFile(path, true, NSUTF8StringEncoding, null)
    }

    actual fun removeValue(path: String){
        TODO("Not yet implemented")
    }

    actual fun clearAll(){
        TODO("Not yet implemented")
    }
}
package org.tokenscript.engine.storage

import android.content.Context
import java.io.File

actual open class DefaultKeyValueStorage actual constructor() : DefaultKeyValueStorageInterface {

    lateinit var context: Context

    constructor(context: Context): this() {
        this.context = context
    }

    actual override fun readValue(path: String): String? {
        val basePath: File = context.filesDir

        return String(File(basePath, "$path.json").readBytes())
    }

    actual override fun writeValue(path: String, value: String){
        TODO("Not yet implemented")
    }

    actual override fun removeValue(path: String){
        TODO("Not yet implemented")
    }

    actual override fun clearAll(){
        TODO("Not yet implemented")
    }
}
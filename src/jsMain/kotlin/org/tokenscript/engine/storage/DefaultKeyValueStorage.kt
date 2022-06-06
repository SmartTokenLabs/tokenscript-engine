package org.tokenscript.engine.storage

import kotlinx.browser.localStorage

actual open class DefaultKeyValueStorage {

    actual fun readValue(path: String): String? {
        return localStorage.getItem(path)
    }

    actual fun writeValue(path: String, value: String){
        localStorage.setItem(path, value)
    }

    actual fun removeValue(path: String){
        localStorage.removeItem(path)
    }

    actual fun clearAll(){
        localStorage.clear()
    }
}
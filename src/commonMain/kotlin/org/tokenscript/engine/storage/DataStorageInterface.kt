package org.tokenscript.engine.storage

interface DataStorageInterface {

    val tsId: String

    fun readData(key: String)

    fun writeData(tsId: String, data: String)

}
package org.tokenscript.engine

import DefaultAndroidDefinitionStorage
import android.content.Context
import org.tokenscript.engine.api.EngineApiBase
import org.tokenscript.engine.storage.DefinitionStorageInterface

actual class TSEngine actual constructor(): EngineApiBase() {

    lateinit var context: Context

    override val defStorageProvider: DefinitionStorageInterface
        get() {
            return DefaultAndroidDefinitionStorage(this.context)
        }

    constructor(context: Context) : this() {
        this.context = context.applicationContext;
    }


}
package org.tokenscript.engine

import android.content.Context
import org.tokenscript.engine.api.EngineApiBase

actual class TSEngine actual constructor(basePath: String) : EngineApiBase(basePath) {

    lateinit var context: Context

    constructor(context: Context): this(context.applicationContext.filesDir.path) {
        this.context = context.applicationContext
    }

}
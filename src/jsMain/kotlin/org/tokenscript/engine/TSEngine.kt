package org.tokenscript.engine

import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.promise
import org.tokenscript.engine.api.EngineApiBase

@OptIn(ExperimentalJsExport::class)
@JsExport
actual class TSEngine: EngineApiBase() {

    @OptIn(DelicateCoroutinesApi::class)
    fun getTokenScriptAsync(tsId: String) = GlobalScope.promise {
        return@promise super.getTokenScript(tsId);
    }
}
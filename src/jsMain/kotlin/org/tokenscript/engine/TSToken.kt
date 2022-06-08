package org.tokenscript.engine

import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.promise
import org.tokenscript.engine.api.TokenApiBase
import org.tokenscript.engine.api.TokenApiJsInterface
import org.tokenscript.engine.token.tools.TokenDefinition

@OptIn(ExperimentalJsExport::class)
@JsExport
actual class TSToken actual constructor(tokenMeta: TokenDefinition) : TokenApiBase(tokenMeta), TokenApiJsInterface {

    @OptIn(DelicateCoroutinesApi::class)
    override fun testHttpAsync() = GlobalScope.promise {
        return@promise super.testHttp();
    }
}
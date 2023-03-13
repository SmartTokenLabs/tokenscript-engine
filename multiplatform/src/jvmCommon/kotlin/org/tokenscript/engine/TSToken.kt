package org.tokenscript.engine

import org.tokenscript.engine.api.TokenApiBase
import org.tokenscript.engine.token.tools.TokenDefinition

actual class TSToken actual constructor(tokenMeta: TokenDefinition) : TokenApiBase(tokenMeta) {

}
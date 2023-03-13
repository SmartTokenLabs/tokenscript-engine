package org.tokenscript.engine

import org.tokenscript.engine.api.TokenApiBase
import org.tokenscript.engine.token.tools.TokenDefinition

expect class TSToken(tokenMeta: TokenDefinition) : TokenApiBase {

}
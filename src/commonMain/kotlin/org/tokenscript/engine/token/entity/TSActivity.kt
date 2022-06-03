package org.tokenscript.engine.token.entity

/**
 * Created by JB on 27/07/2020.
 */
class TSActivity {
    var order = 0
    var exclude: String? = null
    var view: TSTokenView? = null
    var style = ""
    var name: String? = null
    var attributes: Map<String, Attribute>? = null
    var function: FunctionDefinition? = null
}
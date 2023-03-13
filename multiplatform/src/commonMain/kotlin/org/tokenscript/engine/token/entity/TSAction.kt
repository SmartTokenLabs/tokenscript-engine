package org.tokenscript.engine.token.entity

/**
 * Created by James on 2/04/2019.
 * Stormbird in Singapore
 */
class TSAction {
    var order = 0
    var exclude: String? = null
    var view: TSTokenView? = null
    var style = ""
    var name: String? = null
    var attributes: MutableMap<String, Attribute> = HashMap()
    var function: FunctionDefinition? = null
}
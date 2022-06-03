package org.tokenscript.engine.token.entity

/**
 * Created by James on 11/04/2019.
 * Stormbird in Singapore
 */
interface ParseResult {
    enum class ParseResultId {
        OK, XML_OUT_OF_DATE, PARSER_OUT_OF_DATE, PARSE_FAILED
    }

    fun parseMessage(parseResult: ParseResultId?)
}
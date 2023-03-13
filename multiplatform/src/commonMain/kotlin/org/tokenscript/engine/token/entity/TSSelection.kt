package org.tokenscript.engine.token.entity

/**
 * Created by JB on 21/05/2020.
 */
class TSSelection(filterExpression: String) {
    var head: TSFilterNode? = null
    var denialMessage: String? = null
    var names: Map<String, String>? = null //use these names if the selection filter is true
    private var negate = false
    var name: String? = null

    init {
        //tokenise
        val tokens = tokeniseExpression(filterExpression)
        val tokenItr = tokens.listIterator()

        //recursive parse
        head = parseNextNode(null, tokenItr)
    }

    @Throws(Exception::class)
    private fun parseNextNode(currentNode: TSFilterNode?, tokens: ListIterator<String>): TSFilterNode? {
        if (!tokens.hasNext()) return currentNode
        val token = tokens.next()
        val type: FilterType = getType(token)
        val thisNode: TSFilterNode
        when (type) {
            FilterType.AND, FilterType.OR -> {
                thisNode =
                    TSFilterNode(type, currentNode) // now we're expecting leaf logic or the start of another tree
                if (negate) {
                    thisNode.negate = true
                    negate = false
                }
                thisNode.first = parseNextNode(thisNode, tokens)
                thisNode.second = parseNextNode(thisNode, tokens)
                return thisNode
            }
            FilterType.NOT -> {
                negate = true
                return parseNextNode(currentNode, tokens)
            }
            FilterType.GREATER_THAN, FilterType.LESS_THAN, FilterType.EQUAL ->                 //this should occur between two leaf nodes, shouldn't see this here
                if (tokens.hasPrevious()) {
                    throw Exception("PARSE ERROR: Unexpected '" + type.toString() + "' after " + tokens.previous()) // TODO: character place
                } else {
                    throw Exception("PARSE ERROR: Unexpected '" + type.toString() + "'")
                }
            FilterType.VALUE ->                 //leaf logic; should be of the form "a" <comparator> "b"
                return parseLeafConstruct(currentNode, tokens)
            FilterType.START_BRACE -> {
                //parse all in here until end of this brace
                var braceLevel = 1
                val tokensInBrace: MutableList<String> = ArrayList<String>()
                while (braceLevel > 0 && tokens.hasNext()) {
                    val braceToken = tokens.next()
                    val braceType: FilterType = getType(braceToken)
                    if (braceType === FilterType.END_BRACE) {
                        braceLevel--
                    } else if (braceType === FilterType.START_BRACE) {
                        braceLevel++
                    }
                    if (braceLevel > 0) tokensInBrace.add(braceToken)
                }
                if (braceLevel != 0) {
                    if (tokensInBrace.size > 0) throw Exception("PARSE ERROR: Unterminated brace in filter expression after '" + tokensInBrace[tokensInBrace.size - 1] + "'") else throw Exception(
                        "PARSE ERROR: Unterminated brace in filter expression"
                    )
                }
                return parseNextNode(currentNode, tokensInBrace.listIterator())
            }
            FilterType.END_BRACE -> if (tokens.hasPrevious()) {
                throw Exception("PARSE ERROR: Unexpected ')' after " + tokens.previous()) // TODO: character place
            } else {
                throw Exception("PARSE ERROR: Unexpected ')'")
            }
        }
        return currentNode
    }

    @Throws(Exception::class)
    private fun parseLeafConstruct(currentNode: TSFilterNode?, tokens: ListIterator<String>): TSFilterNode {
        //parse the form "a" <comparator> "b"
        val a = tokens.previous()
        if (!tokens.hasNext()) {
            throw Exception("PARSE ERROR: No comparator after '$a")
        }
        tokens.next() //advance past previous
        val logic = tokens.next()
        val typeLogic: FilterType = getType(logic)
        if (!TSFilterNode.isLeafLogic(typeLogic)) {
            throw Exception("PARSE ERROR: Unexpected comparator '$logic' after '$a")
        }
        if (!tokens.hasNext()) {
            throw Exception("PARSE ERROR: No comparator subject after '$a$logic")
        }
        val b = tokens.next()
        val typeB: FilterType = getType(b)
        if (!(typeB === FilterType.VALUE || typeB === FilterType.ATTRIBUTE)) {
            throw Exception("PARSE ERROR: Invalid subject after '$a$logic")
        }
        val comparator = TSFilterNode(typeLogic, currentNode)
        comparator.first = TSFilterNode(a, comparator, FilterType.ATTRIBUTE)
        comparator.second = TSFilterNode(b, comparator, typeB)
        if (negate) {
            comparator.negate = true
            negate = false
        }
        return comparator
    }

    private fun getType(token: String): FilterType {
        val type: FilterType
        type = when (token) {
            "|" -> FilterType.OR
            "&" -> FilterType.AND
            "<=" -> FilterType.LESS_THAN_OR_EQUAL_TO
            ">=" -> FilterType.GREATER_THAN_OR_EQUAL
            "<" -> FilterType.LESS_THAN
            ">" -> FilterType.GREATER_THAN
            "(" -> FilterType.START_BRACE
            ")" -> FilterType.END_BRACE
            "=" -> FilterType.EQUAL
            "!" -> FilterType.NOT
            else -> unwrapValue(token)
        }
        return type
    }

    @Throws(Exception::class)
    private fun tokeniseExpression(filterExpression: String): List<String> {
        val tokens: MutableList<String> = ArrayList<String>()
        val token: StringBuilder = StringBuilder()
        var remaining: Int
        var index = 0
        while (index < filterExpression.length) {
            remaining = filterExpression.length - 1 - index
            val c: String = filterExpression[index].toString()
            when (filterExpression[index]) {
                '|' -> addTokens(tokens, c, token)
                '&' -> addTokens(tokens, c, token)
                '>', '<' -> if (remaining > 1 && filterExpression[index + 1] == '=') {
                    addTokens(tokens, c + filterExpression[index + 1], token)
                    index++
                } else {
                    addTokens(tokens, c, token)
                }
                '(' -> addTokens(tokens, c, token)
                ')' -> addTokens(tokens, c, token)
                '=' -> addTokens(tokens, c, token)
                '!' -> addTokens(tokens, c, token)
                else -> if (!c[0].isWhitespace()) {
                    token.append(c)
                }
            }
            index++
        }
        if (token.length > 0) {
            tokens.add(token.toString())
        }
        return tokens
    }

    private fun addTokens(tokens: MutableList<String>, logic: String, token: StringBuilder) {
        if (token.length > 0) tokens.add(token.toString())
        token.setLength(0)
        tokens.add(logic)
    }

    val requiredAttrs: List<String?>
        get() {
            val attrs: MutableList<String?> = ArrayList()
            return crawlTreeForAttrs(head, attrs)
        }

    private fun crawlTreeForAttrs(node: TSFilterNode?, attrs: MutableList<String?>): List<String?> {
        //left side
        if (node!!.strValue != null && node!!.value == null) {
            //leaf
            if (!attrs.contains(node!!.strValue)) attrs.add(node!!.strValue)
        }
        if (node!!.first != null) {
            crawlTreeForAttrs(node!!.first, attrs)
        }
        if (node!!.second != null) {
            crawlTreeForAttrs(node!!.second, attrs)
        }
        return attrs
    }

    private fun unwrapValue(token: String): FilterType {
        val matchResult = decodeParam.find(token);
        return if (matchResult != null && matchResult.groups.get(1)?.value?.isNotEmpty() == true) {
            //found an attribute param
            FilterType.ATTRIBUTE
        } else {
            FilterType.VALUE
        }
    }

    fun checkParse(): Boolean {
        return name != null && name!!.length > 0 && head != null
    }

    companion object {
        val decodeParam: Regex = Regex("[$][{](\\w*)[}]$")
    }
}
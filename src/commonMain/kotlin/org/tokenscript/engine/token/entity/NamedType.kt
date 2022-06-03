package org.tokenscript.engine.token.entity

import nl.adaptivity.xmlutil.dom.*

/**
 * Created by JB on 20/03/2020 for namedType in ASN.X included in TokenScript. It's used for events & attestations.
 */
class NamedType(val name: String) {
    var sequence: MutableList<SequenceElement> = ArrayList<SequenceElement>()
    @Throws(Exception::class)
    fun addSequenceElement(element: Element, sequenceName: String) {
        val se: SequenceElement = SequenceElement()
        for (i in 0 until element.getAttributes().getLength()) {
            val thisAttr: Attr = element.getAttributes().item(i) as Attr
            val value: String = thisAttr.getValue()
            when (thisAttr.getLocalName()) {
                "type" -> se.type = value
                "name" -> se.name = value
                "indexed" -> if (value.equals("true", ignoreCase = true)) se.indexed = true
                else -> throw Exception("Unexpected event attribute in: " + sequenceName + " attribute: " + thisAttr.getLocalName())
            }
        }
        if (se.type == null || se.type!!.length == 0) {
            throw Exception("Malformed sequence element in: " + sequenceName + " name: " + se.name)
        } else if (se.name == null || se.name!!.length == 0) {
            throw Exception("Malformed sequence element in: " + sequenceName + " type: " + se.type)
        }
        sequence.add(se)
    }

    val sequenceArgs: List<SequenceElement>
        get() = sequence

    fun getArgNames(indexed: Boolean): List<String?> {
        val argNameIndexedList: MutableList<String?> = ArrayList()
        for (se in sequence) {
            if (se.indexed == indexed) {
                argNameIndexedList.add(se.name)
            }
        }
        return argNameIndexedList
    }

    fun getTopicIndex(filterTopic: String): Int {
        var topicIndex = -1
        var currentIndex = 0
        for (se in sequence) {
            if (se.indexed) {
                if (se.name == filterTopic) {
                    topicIndex = currentIndex
                    break
                } else {
                    currentIndex++
                }
            }
        }
        return topicIndex
    }

    fun getNonIndexedIndex(topic: String): Int {
        var topicIndex = -1
        var currentIndex = 0
        for (se in sequence) {
            if (!se.indexed) {
                if (se.name == topic) {
                    topicIndex = currentIndex
                    break
                } else {
                    currentIndex++
                }
            }
        }
        return topicIndex
    }

    inner class SequenceElement {
        var name: String? = null
        var type: String? = null
        var indexed = false
    }
}
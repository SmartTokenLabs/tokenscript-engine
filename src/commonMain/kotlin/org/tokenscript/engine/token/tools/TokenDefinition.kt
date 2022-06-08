package org.tokenscript.engine.token.tools

import com.ionspin.kotlin.bignum.integer.BigInteger
import com.soywiz.klock.DateTime
import io.fluidsonic.locale.Locale
import io.ktor.utils.io.charsets.*
import nl.adaptivity.xmlutil.dom.*
import nl.adaptivity.xmlutil.serialization.ElementSerializer
import nl.adaptivity.xmlutil.serialization.NodeSerializer
import nl.adaptivity.xmlutil.serialization.XML
import org.tokenscript.engine.token.entity.*

class TokenDefinition {

    lateinit var xml: Element
    val attributes: MutableMap<String, Attribute> = HashMap()
    lateinit var locale: Locale
    val contracts: MutableMap<String?, ContractInfo> = HashMap()
    val actions: MutableMap<String, TSAction> = HashMap()
    private var labels: Map<String, String> = HashMap() // store plural etc for token name
    private val namedTypeLookup: MutableMap<String?, NamedType> = HashMap() //used to protect against name collision
    private val tokenViews: TSTokenViewHolder = TSTokenViewHolder()
    private val selections: MutableMap<String, TSSelection> = HashMap()
    private val activityCards: MutableMap<String, TSActivityView?> = HashMap()
    var nameSpace: String? = null
    var context: TokenscriptContext? = null
    var holdingToken: String? = null
    private var actionCount = 0

    /* the following are incorrect, waiting to be further improved
     with suitable XML, because none of these String typed class variables
     are going to be one-per-XML-file:

     - each contract <feature> normally should invoke new code modules
       e.g. when a new decentralised protocol is introduced, a new
       class to handle the protocol needs to be introduced, which owns
       it own way of specifying implementation, like marketQueueAPI.

     - tokenName is going to be selectable through filters -
       that is, it's allowed that token labels are different in the
       same asset class. There are use-cases for this.

     - each token definition XML file can incorporate multiple
       contracts, each with different network IDs.

     - each XML file can be signed multiple times, with multiple
       <KeyName>.
    */
    var keyName: String? = null
        protected set

    val functionData: List<Any>
        get() {
            val defs: MutableList<FunctionDefinition> = ArrayList()
            for (attr in attributes.values) {
                if (attr.function != null) {
                    attr.function?.let { defs.add(it) }
                }
            }
            return defs
        }

    fun getActivityCards(): Map<String, TSActivityView?> {
        return activityCards
    }

    fun parseEvent(resolve: Element): EventDefinition {
        val ev = EventDefinition()
        for (i in 0 until resolve.getAttributes().getLength()) {
            val thisAttr: Attr = resolve.getAttributes().item(i) as Attr
            val attrValue: String = thisAttr.getValue()
            when (thisAttr.getName()) {
                "contract" -> ev.contract = contracts[attrValue]
                "type" -> {
                    ev.type = namedTypeLookup[attrValue]
                    if (ev.type == null) {
                        throw Exception("Event module not found: $attrValue")
                    }
                }
                "filter" -> ev.filter = attrValue
                "select" -> ev.select = attrValue
            }
        }
        return ev
    }

    fun parseFunction(resolve: Element, syntax: Syntax): FunctionDefinition {
        val function = FunctionDefinition()
        val contract = resolve.getAttribute("contract")
        function.contract = contracts[contract]
        if (function.contract == null) {
            function.contract = contracts[holdingToken]
        }
        function.method = resolve.getAttribute("function")
        function.`as` = parseAs(resolve)
        addFunctionInputs(function, resolve)
        function.syntax = syntax
        return function
    }

    fun parseAs(resolve: Element?): As {
        return when (resolve?.getAttribute("as")?.lowercase()) {
            "signed" -> As.Signed
            "string", "utf8", "" -> As.UTF8
            "bytes" -> As.Bytes
            "e18" -> As.e18
            "e8" -> As.e8
            "e6" -> As.e6
            "e4" -> As.e4
            "e3" -> As.e3
            "e2" -> As.e2
            "bool" -> As.Boolean
            "mapping" -> As.Mapping
            "address" -> As.Address
            else -> As.Unsigned
        }
    }

    fun getEventDefinition(activityName: String): EventDefinition? {
        if (getActivityCards().size > 0) {
            val v: TSActivityView? = getActivityCards()[activityName]
            if (v != null) {
                return getActivityEvent(activityName)
            }
        }
        return null
    }

    fun getActivityEvent(activityCardName: String): EventDefinition {
        val av: TSActivityView? = activityCards[activityCardName]
        val ev = EventDefinition()
        ev.contract = contracts[holdingToken]
        ev.filter = av?.activityFilter
        ev.type = namedTypeLookup[av?.eventName]
        ev.activityName = activityCardName
        ev.parentAttribute = null
        ev.select = null
        return ev
    }

    fun hasEvents(): Boolean {
        for (attrName in attributes.keys) {
            val attr: Attribute = attributes[attrName]!!
            if (attr.event != null && attr.event!!.contract != null) {
                return true
            }
        }
        return if (getActivityCards().size > 0) {
            true
        } else false
    }

    enum class Syntax {
        DirectoryString, IA5String, Integer, GeneralizedTime, Boolean, BitString, CountryString, JPEG, NumericString
    }

    /* for many occurance of the same tag, return the text content of the one in user's current language */ // FIXME: this function will break if there are nested <tagName> in the nameContainer
    fun getLocalisedString(nameContainer: Element, tagName: String): String? {
        val nList: NodeList = nameContainer.getElementsByTagNameNS(nameSpace, tagName)
        var name: Element
        var nonLocalised: String? = null
        for (i in 0 until nList.getLength()) {
            name = nList.item(i) as Element
            val langAttr = getLocalisationLang(name)
            if (langAttr == locale.language) {
                return name.getTextContent()
            } else if (langAttr == "en") nonLocalised = name.getTextContent()
        }
        return if (nonLocalised != null) nonLocalised else {
            name = nList.item(0) as Element
            // TODO: catch the indice out of bound exception and throw it again suggesting dev to check schema
            name.getTextContent()
        }
    }

    fun getLocalisedNode(nameContainer: Element, tagName: String): Node? {
        var nList: NodeList = nameContainer.getElementsByTagNameNS(nameSpace, tagName)
        if (nList.getLength() == 0) nList = nameContainer.getElementsByTagName(tagName)
        var name: Element
        var nonLocalised: Element? = null
        for (i in 0 until nList.getLength()) {
            name = nList.item(i) as Element
            val langAttr = getLocalisationLang(name)
            if (langAttr == locale.language) {
                return name
            } else if (nonLocalised == null && (langAttr == "" || langAttr == "en")) {
                nonLocalised = name
            }
        }
        return nonLocalised
    }

    fun getLocalisedString(container: Element): String? {
        val nList: NodeList = container.getChildNodes()
        var nonLocalised: String? = null
        for (i in 0 until nList.getLength()) {
            val n: Node? = nList.item(i)
            if (n != null && n.getNodeType() == NodeConsts.ELEMENT_NODE) {
                val langAttr = getLocalisationLang(n as Element)
                if (langAttr == locale.language) {
                    return n.getTextContent()
                } else if (nonLocalised == null && (langAttr == "" || langAttr == "en")) {
                    nonLocalised = n.getTextContent()
                }
            }
        }
        return nonLocalised
    }

    private fun hasAttribute(name: Element, typeAttr: String): Boolean {
        if (name.getAttributes().getLength() > 0) {
            for (i in 0 until name.getAttributes().getLength()) {
                val thisAttr: Node? = name.getAttributes().item(i)
                if (thisAttr?.getTextContent() != null && thisAttr?.getTextContent() == typeAttr) {
                    return true
                }
            }
        }
        return false
    }

    private fun getLocalisationLang(name: Element): String {
        if (name.getAttributes().getLength() > 0) {
            for (i in 0 until name.getAttributes().getLength()) {
                val thisAttr: Attr = name.getAttributes().item(i) as Attr
                if (thisAttr.getName() == "lang") {
                    return thisAttr.getValue()
                }
            }
        }
        return ""
    }

    //Empty definition
    constructor() {
        holdingToken = null
    }

    constructor(xmlAsset: ByteArray, locale: Locale = Locale.forLanguageTag("en-au"), result: ParseResult) {

        val xmlParser = XML() {
            autoPolymorphic = false
            repairNamespaces = true
        }

        xml = xmlParser.decodeFromString(ElementSerializer, xmlAsset.decodeToString())

        println(xml.getChildNodes().getLength())

        this.locale = locale

        /*
        /* guard input from bad programs which creates Locale not following ISO 639 */if (locale.getLanguage().length < 2 || locale.getLanguage().length > 3) {
            throw Exception("Locale object wasn't created following ISO 639")
        }
        val dBuilder: javax.xml.parsers.DocumentBuilder
        dBuilder = try {
            val dbFactory: javax.xml.parsers.DocumentBuilderFactory =
                javax.xml.parsers.DocumentBuilderFactory.newInstance()
            dbFactory.setNamespaceAware(true)
            dbFactory.setExpandEntityReferences(true)
            dbFactory.setCoalescing(true)
            dbFactory.newDocumentBuilder()
        } catch (e: javax.xml.parsers.ParserConfigurationException) {
            // TODO: if schema has problems (e.g. defined twice). Now, no schema, no exception.
            e.printStackTrace()
            return
        }
        val xml: org.w3c.dom.Document = dBuilder.parse(xmlAsset)*/

        //xml.getDocumentElement().normalize()
        determineNamespace(xml, result)
        //val nList: NodeList = xml.getElementsByTagNameNS(nameSpace, "token")

        if (xml.getLocalName() != "token") {
            println("Legacy XML format - no longer supported")
            return
        }

        try {
            parseTags(xml)
            extractSignedInfo(xml)
        } catch (e: Exception) {
            e.printStackTrace() //catch other type of exception not thrown by this function.
            result.parseMessage(ParseResult.ParseResultId.PARSE_FAILED)
        }
    }

    @Throws(Exception::class)
    private fun extractTags(element: Element) {
        //trawl through the child nodes, interpret each in turn
        //var n: Node? = token.getFirstChild()
        //while (n != null) {
            //if (n.getNodeType() == NodeConsts.ELEMENT_NODE) {
                //val element: Element = token as Element
                when (element.getLocalName()) {
                    "origins" -> {
                        val origin: TSOrigins? = parseOrigins(element) //parseOrigins(element);
                        if (origin != null && origin.isType(TSOriginType.Contract)) holdingToken = origin.originName
                    }
                    "contract" -> handleAddresses(element)
                    "label" -> labels = extractLabelTag(element)
                    "selection" -> {
                        val selection: TSSelection? = parseSelection(element)
                        if (selection != null && selection.checkParse()) selections.set(selection.name!!, selection)
                    }
                    "module" -> handleModule(element, null)
                    "cards" -> handleCards(element)
                    "attribute" -> {
                        val attr = Attribute(element, this)
                        if (attr.bitmask != null || attr.function != null) {
                            attributes[attr.name!!] = attr
                        }
                    }
                    else -> {}
                }
            //}
            //n = n.getNextSibling()
        //}
    }

    @Throws(Exception::class)
    private fun parseSelection(node: Element): TSSelection? {
        var name = ""
        var selection: TSSelection? = null
        for (i in 0 until node.getAttributes().getLength()) {
            val thisAttr: Attr = node.getAttributes().item(i) as Attr
            when (thisAttr.getLocalName()) {
                "name", "id" -> name = thisAttr.value
                "filter" -> selection = TSSelection(thisAttr.value)
            }
        }
        if (selection != null) {
            selection.name = name
            var n: Node? = node.getFirstChild()
            while (n != null) {
                if (n.getNodeType() == NodeConsts.ELEMENT_NODE) {
                    val element: Element = n as Element
                    when (element.getLocalName()) {
                        "name" -> selection.names = extractLabelTag(element)
                        "denial" -> {
                            val denialNode: Node? = getLocalisedNode(element, "string")
                            selection.denialMessage = if (denialNode != null) denialNode.getTextContent() else null
                        }
                    }
                }
                n = n.getNextSibling()
            }
        }
        return selection
    }

    @Throws(Exception::class)
    private fun handleCards(cards: Element) {
        var node: Node? = cards.getFirstChild()
        while (node != null) {
            if (node.getNodeType() == NodeConsts.ELEMENT_NODE) {
                val card: Element = node as Element
                when (card.getLocalName()) {
                    "token" -> processTokenCardElements(card)
                    "card" -> extractCard(card)
                }
            }
            node = node.getNextSibling()
        }
    }

    @Throws(Exception::class)
    private fun processActivityView(card: Element): TSActivityView? {
        val ll: NodeList = card.getChildNodes()
        var activityView: TSActivityView? = null
        for (j in 0 until ll.getLength()) {
            val node: Node? = ll.item(j)

            if (node != null) {
                if (node.getNodeType() != NodeConsts.ELEMENT_NODE) continue
                val element: Element = node as Element
                when (node.getLocalName()) {
                    "origins" -> {
                        val origins: TSOrigins? = parseOrigins(element)
                        if (origins != null && origins.isType(TSOriginType.Event)) activityView = TSActivityView(origins)
                    }
                    "view", "item-view" -> {
                        if (activityView == null) throw Exception("Activity card declared without origins tag")
                        activityView.addView(node.getLocalName(), TSTokenView(element))
                    }
                    else -> throw Exception("Unknown tag <" + node.getLocalName() + "> tag in tokens")
                }
            }
        }
        return activityView
    }

    @Throws(Exception::class)
    private fun processTokenCardElements(card: Element) {
        val ll: NodeList = card.getChildNodes()
        for (j in 0 until ll.getLength()) {
            val node: Node? = ll.item(j)

            if (node != null) {
                if (node.getNodeType() != NodeConsts.ELEMENT_NODE) continue
                val element: Element = node as Element
                when (node.getLocalName()) {
                    "attribute" -> {
                        val attr = Attribute(element, this)
                        if (attr.name != null)
                            tokenViews.localAttributeTypes[attr.name] = attr
                    }
                    "view", "item-view" -> {
                        val v = TSTokenView(element)
                        tokenViews.views.put(node.getLocalName(), v)
                    }
                    "view-iconified" -> throw Exception("Deprecated <view-iconified> used in <ts:token>. Replace with <item-view>")
                    "style" -> tokenViews.globalStyle = getHTMLContent(element)
                    "script" -> throw Exception("Misplaced <script> tag in <ts:token>")
                    else -> throw Exception("Unknown tag <" + node.getLocalName() + "> tag in tokens")
                }
            }
        }
    }

    private fun getLocalisedEntry(attrEntry: Map<String, String>): String? {
        //Picking order
        //1. actual locale
        //2. entry with no locale
        //3. first non-localised locale
        var bestGuess: String? = null
        for (lang in attrEntry.keys) {
            if (lang == locale.language) return attrEntry[lang]
            if (lang == "" || lang == "en") bestGuess = attrEntry[lang]
        }
        if (bestGuess == null) bestGuess = attrEntry.values.iterator().next() //first non-localised locale
        return bestGuess
    }

    private fun determineNamespace(xml: Element, result: ParseResult?) {
        nameSpace = ATTESTATION
        //val check: NodeList = xml.getChildNodes()
        //for (i in 0 until check.getLength()) {

            //println("Node type: " + check.item(i)?.getNodeType())

            //if (check.item(i)?.getNodeType() != NodeConsts.ELEMENT_NODE)
                //continue

            //val n: Element = check.item(i) as Element

            println("Attributes: " + xml.getAttributes().getLength())

            println("TS NS: " + xml.getNamespaceURI())

            //if (xml.getAttributes().getLength() > 0)
                //for (j in 0 until xml.getAttributes().getLength()) {
                    try {
                        //val thisAttr: Attr = xml.getAttributes().item(j) as Attr

                        //println("Attr: " + thisAttr.name + " - " + thisAttr.value)

                        if (xml.getNamespaceURI()?.contains(TOKENSCRIPT_BASE_URL) == true) {
                            nameSpace = xml.getNamespaceURI()
                            val dateIndex = nameSpace!!.indexOf(TOKENSCRIPT_BASE_URL) + TOKENSCRIPT_BASE_URL.length
                            val lastSeparator = nameSpace!!.lastIndexOf("/")

                            if (lastSeparator - dateIndex == 7) {

                                val thisDate= nameSpace!!.substring(dateIndex, lastSeparator)
                                val schemaDate = TOKENSCRIPT_CURRENT_SCHEMA

                                if (thisDate == schemaDate) {
                                    //all good
                                    if (result != null) result.parseMessage(ParseResult.ParseResultId.OK)
                                } else if (thisDate < schemaDate) {
                                    //still acceptable
                                    if (result != null) result.parseMessage(ParseResult.ParseResultId.XML_OUT_OF_DATE)
                                } else {
                                    //cannot parse future schema
                                    if (result != null) result.parseMessage(ParseResult.ParseResultId.PARSER_OUT_OF_DATE)
                                    nameSpace = null
                                }
                            } else {
                                if (result != null) result.parseMessage(ParseResult.ParseResultId.PARSE_FAILED)
                                nameSpace = null
                            }
                            return
                        }
                    } catch (e: Exception) {
                        if (result != null) result.parseMessage(ParseResult.ParseResultId.PARSE_FAILED)
                        nameSpace = null
                        println(e.message)
                        //e.printStackTrace()
                    }
                //}

            if (result != null)
                result.parseMessage(ParseResult.ParseResultId.PARSE_FAILED)
        //}
    }

    @Throws(Exception::class)
    private fun extractCard(card: Element) {
        val type: String = card.getAttribute("type").toString()
        when (type) {
            "token" -> processTokenCardElements(card)
            "action" -> {
                val action: TSAction = handleAction(card)
                if (action.name != null)
                    actions[action.name!!] = action
            }
            "activity" -> {
                val activity: TSActivityView? = processActivityView(card)
                val name = card.getAttribute("name")
                if (name != null)
                    activityCards[name] = activity
            }
            else -> throw Exception("Unexpected card type found: $type")
        }
    }

    @Throws(Exception::class)
    private fun handleAction(action: Element): TSAction {
        val ll: NodeList = action.getChildNodes()
        val tsAction = TSAction()
        tsAction.order = actionCount
        tsAction.exclude = action.getAttribute("exclude")
        actionCount++
        for (j in 0 until ll.getLength()) {

            val element: Node? = ll.item(j)
            if (element != null && element.getNodeType() != NodeConsts.ELEMENT_NODE) continue

            element as Element

            if (element.getPrefix() != null && element.getPrefix().equals("ds", ignoreCase = true)) continue

            when (element.getLocalName()) {
                "label" -> tsAction.name = getLocalisedString(element)
                "attribute" -> {
                    val attr = Attribute(element, this)
                    tsAction.attributes.set(attr.name.toString(), attr)
                }
                "transaction" -> handleTransaction(tsAction, element)
                "exclude" -> tsAction.exclude = element.getAttribute("selection")
                "selection" -> throw Exception("<ts:selection> tag must be in main scope (eg same as <ts:origins>)")
                "view" -> tsAction.view = TSTokenView(element)
                "style" -> tsAction.style = getHTMLContent(element)
                "input" -> {
                    handleInput(element)
                    holdingToken = contracts.keys.iterator().next() //first key value
                }
                "output" -> {}
                "script" -> throw Exception("Misplaced <script> tag in Action '" + tsAction.name + "'")
                else -> throw Exception("Unknown tag <" + element.getLocalName() + "> tag in Action '" + tsAction.name + "'")
            }
        }
        return tsAction
    }

    private fun getFirstChildElement(e: Element): Element? {
        var n: Node? = e.getFirstChild()
        while (n != null) {
            if (n.getNodeType() == NodeConsts.ELEMENT_NODE) return n as Element
            n = n.getNextSibling()
        }
        return null
    }

    @Throws(Exception::class)
    private fun handleInput(element: Element) {
        var n: Node? = element.getFirstChild()
        while (n != null) {
            if (n.getNodeType() != NodeConsts.ELEMENT_NODE) {
                n = n.getNextSibling()
                continue
            }
            val tokenType: Element = n as Element
            val label: String? = tokenType.getAttribute("label")
            when (tokenType.getLocalName()) {
                "token" -> {
                    val tokenSpec: Element? = getFirstChildElement(tokenType)
                    if (tokenSpec != null) {
                        when (tokenSpec.getLocalName()) {
                            "ethereum" -> {
                                val chainIdStr: String? = tokenSpec.getAttribute("network")

                                if (chainIdStr == null) continue

                                val chainId = chainIdStr.toLong()
                                val ci = ContractInfo(tokenSpec.getLocalName())
                                ci.addresses.put(
                                    chainId,
                                    ArrayList(listOf(ci.contractInterface))
                                )
                                contracts[label] = ci
                            }
                            "contract" -> getFirstChildElement(element)?.let { handleAddresses(it) }
                            else -> {}
                        }
                    }
                }
                else -> {}
            }
            n = n.getNextSibling()
        }
    }

    private fun handleTransaction(tsAction: TSAction, element: Element) {
        val tx: Element? = getFirstChildElement(element)
        when (tx?.getLocalName()) {
            "transaction" -> if (tx.getPrefix() == "ethereum") {
                tsAction.function = parseFunction(tx, Syntax.IA5String)
                if (tsAction.function != null)
                    tsAction.function!!.`as` = parseAs(tx)
            }
            else -> {}
        }
    }

    @Throws(Exception::class)
    private fun processAttrs(n: Node) {
        val attr = Attribute(n as Element, this)
        if (attr.name != null) {
            attributes[attr.name] = attr
        }
    }

    private fun extractSignedInfo(xml: Element) {
        val nList: NodeList
        nList = xml.getElementsByTagNameNS("http://www.w3.org/2000/09/xmldsig#", "KeyName")
        if (nList.getLength() > 0) {
            keyName = nList.item(0)?.getTextContent()
        }
        return  // even if the document is signed, often it doesn't have KeyName
    }

    val tokenNameList: String
        get() {
            val sb: StringBuilder = StringBuilder()
            var first = true
            for (labelKey in labels.keys) {
                if (!first) sb.append(",")
                sb.append(labelKey).append(",").append(labels[labelKey])
                first = false
            }
            return sb.toString()
        }

    fun getTokenName(count: Int): String? {
        var value: String? = null
        when (count) {
            1 -> value = if (labels.containsKey("one")) labels["one"] else labels[""]
            2 -> {
                value = labels["two"]
                if (value != null) //break //drop through to 'other' if null.
                value = labels["other"]
            }
            else -> value = labels["other"]
        }
        if (value == null && labels.values.size > 0) {
            value = labels.values.iterator().next()
        }
        return value
    }

    fun getMappingMembersByKey(key: String): Map<BigInteger, String>? {
        if (attributes.containsKey(key)) {
            val attr: Attribute = attributes[key]!!
            return attr.members
        }
        return null
    }

    fun getConvertedMappingMembersByKey(key: String): Map<BigInteger, String>? {
        if (attributes.containsKey(key)) {
            val convertedMembers: MutableMap<BigInteger, String> = HashMap()
            val attr: Attribute = attributes[key]!!

            for (actualValue: BigInteger in attr.members.keys) {
                convertedMembers[(actualValue.shl(attr.bitshift).and(attr.bitmask))] = attr.members[actualValue] as String
            }
            return convertedMembers
        }
        return null
    }

    @Throws(Exception::class)
    private fun parseTags(xml: Element) {

        var n: Node? = xml.getFirstChild()

        while (n != null) {

            if (n.getNodeType() != NodeConsts.ELEMENT_NODE) {
                n = n.getNextSibling()
                continue
            }

            n as Element

            when (n.getLocalName()) {
                "card" -> {
                    val action: TSAction = handleAction(n)
                    if (action.name != null)
                        actions[action.name!!] = action
                }
                else -> extractTags(n)
            }
            n = n.getNextSibling()
        }
    }

    private fun extractLabelTag(labelTag: Element): Map<String, String> {
        val localNames: MutableMap<String, String> = HashMap<String, String>()
        //deal with plurals
        var nameNode: Node? = getLocalisedNode(labelTag, "plurals")
        if (nameNode != null) {
            for (i in 0 until nameNode.getChildNodes().getLength()) {
                val node: Node? = nameNode.getChildNodes().item(i)
                handleNameNode(localNames, node)
            }
        } else  //no plural
        {
            nameNode = getLocalisedNode(labelTag, "string")
            handleNameNode(localNames, nameNode)
        }
        return localNames
    }

    private fun handleNameNode(localNames: MutableMap<String, String>, node: Node?) {
        if (node != null && node.getNodeType() == NodeConsts.ELEMENT_NODE && (node as Element).getLocalName() == "string") {
            val element: Element = node
            val quantity: String? = element.getAttribute("quantity")
            val name: String? = element.getTextContent()
            if (quantity != null && name != null) {
                localNames[quantity] = name
            }
        }
    }

    @Throws(Exception::class)
    private fun parseOrigins(origins: Element): TSOrigins? {
        var tsOrigins: TSOrigins? = null
        var n: Node? = origins.getFirstChild()
        while (n != null) {
            if (n.getNodeType() != NodeConsts.ELEMENT_NODE) {
                n = n.getNextSibling()
                continue
            }
            val element: Element = n as Element
            when (element.getLocalName()) {
                "ethereum" -> {
                    val contract: String? = element.getAttribute("contract")
                    tsOrigins = TSOrigins.Builder(TSOriginType.Contract)
                        .name(contract).build()
                }
                "event" -> {
                    val ev: EventDefinition = parseEvent(element)
                    ev.contract = contracts[holdingToken]
                    tsOrigins = TSOrigins.Builder(TSOriginType.Event)
                        .name(ev.type?.name)
                        .event(ev).build()
                }
                else -> throw Exception("Unknown Origin Type: '" + element.getLocalName() + "'")
            }
            n = n.getNextSibling()
        }
        return tsOrigins
    }

    @Throws(Exception::class)
    private fun handleAddresses(contract: Element) {
        val int = contract.getAttribute("interface")
        val name = contract.getAttribute("name")

        if (int == null || name == null)
            return

        val info = ContractInfo(int)

        contracts[name] = info
        var n: Node? = contract.getFirstChild()
        while (n != null) {
            if (n.getNodeType() == NodeConsts.ELEMENT_NODE) {
                val element: Element = n as Element
                when (element.getLocalName()) {
                    "address" -> handleAddress(element, info)
                    "module" -> handleModule(element, null)
                }
            }
            n = n.getNextSibling()
        }
    }

    @Throws(Exception::class)
    private fun handleModule(module: Node, namedType: String?) {
        var namedType = namedType
        var n: Node? = module.getFirstChild()
        while (n != null) {
            if (n.getNodeType() == NodeConsts.ELEMENT_NODE) {
                val element: Element = n as Element
                when (n.getNodeName()) {
                    "namedType" -> {
                        namedType = element.getAttribute("name")
                        if (namedType == null || namedType.length == 0) {
                            throw Exception("namedType must have name attribute.")
                        } else if (namedTypeLookup.containsKey(namedType)) {
                            throw Exception("Duplicate Module label: $namedType")
                        }
                        handleModule(element, namedType)
                    }
                    "type" -> {
                        if (namedType == null) throw Exception("type sequence must have name attribute.")
                        handleModule(element, namedType)
                    }
                    "sequence" -> {
                        if (namedType == null) {
                            var contractAddress: String? = ""
                            if (contracts.size > 0) {
                                contractAddress = contracts.keys.iterator().next()
                            }
                            throw Exception("[$contractAddress] Sequence must be enclosed within <namedType name=... />")
                        }
                        val eventDataType: NamedType = handleElementSequence(element, namedType)
                        namedTypeLookup[namedType] = eventDataType
                        namedType = null
                    }
                    else -> {}
                }
            }
            n = n.getNextSibling()
        }
    }

    @Throws(Exception::class)
    private fun handleElementSequence(c: Node, moduleName: String): NamedType {
        val module = NamedType(moduleName)
        var n: Node? = c.getFirstChild()
        while (n != null) {
            if (n.getNodeType() == NodeConsts.ELEMENT_NODE) {
                val element: Element = n as Element
                module.addSequenceElement(element, moduleName)
            }
            n = n.getNextSibling()
        }
        return module
    }

    private fun handleAddress(addressElement: Element, info: ContractInfo) {
        val networkStr: String? = addressElement.getAttribute("network")
        var network: Long = 1
        if (networkStr != null) network = networkStr.toLong()
        val address: String? = addressElement.getTextContent()?.lowercase()
        var addresses: MutableList<String>? = info.addresses[network]
        if (addresses == null) {
            addresses = ArrayList()
            info.addresses[network] = addresses
        }
        if (address != null && !addresses.contains(address)) {
            addresses.add(address)
        }
    }

    private fun getHTMLContent(content: Node): String {

        val sb = StringBuilder()
        for (i in 0 until content.getChildNodes().getLength()) {
            val child: Element = content.getChildNodes().item(i) as Element
            when (child.getNodeType()) {
                NodeConsts.ELEMENT_NODE -> {
                    if (child.getLocalName() == "iframe") continue
                    sb.append("<")
                    sb.append(child.getLocalName())
                    sb.append(htmlAttributes(child))
                    sb.append(">")
                    sb.append(getHTMLContent(child))
                    sb.append("</")
                    sb.append(child.getLocalName())
                    sb.append(">")
                }
                NodeConsts.COMMENT_NODE -> {}
                NodeConsts.ENTITY_REFERENCE_NODE -> {
                    //load in external content
                    val entityRef: String? = child.getTextContent()
                    println(entityRef)
                }
                else -> if (child.getTextContent() != null) {
                    val parsed: String? = child.getTextContent()!!.replace("\u2019", "&#x2019;")
                    sb.append(parsed)
                }
            }
        }
        return sb.toString()
    }

    private fun htmlAttributes(attribute: Element): String {
        val sb = StringBuilder()

        if (attribute.getAttributes().getLength() > 0) {
            for (i in 0 until attribute.getAttributes().getLength()) {
                val node: Attr = attribute.getAttributes().item(i) as Attr
                sb.append(" ")
                sb.append(node.getLocalName())
                sb.append("=\"")
                sb.append(node.getTextContent())
                sb.append("\"")
            }
        }

        return sb.toString()
    }

    fun parseField(
        tokenId: BigInteger,
        token: NonFungibleToken,
        functionMappings: Map<String?, FunctionDefinition?>?
    ) {
        for (key in attributes.keys) {
            val attrtype: Attribute = attributes[key]!!
            var value = BigInteger(0)
            try {
                if (attrtype.function != null && functionMappings != null) {
                    //obtain this value from the token function mappings
                    val functionDef: FunctionDefinition = functionMappings[attrtype.function!!.method]!!

                    var result: String? = functionDef.result
                    println("Result: $result")

                    if (result == null)
                        throw Exception("No function result")

                    if (attrtype.syntax === Syntax.NumericString) {
                        if (result.startsWith("0x")) result = result.substring(2)
                        value = BigInteger.parseString(result, 16)
                    }
                    token.setAttribute(
                        attrtype.name,
                        NonFungibleToken.Attribute(attrtype.name!!, attrtype.label!!, value, result)
                    )
                } else {
                    value = tokenId.and(attrtype.bitmask).shr(attrtype.bitshift)
                    token.setAttribute(
                        attrtype.name,
                        NonFungibleToken.Attribute(attrtype.name!!, attrtype.label!!, value, attrtype.toString(value))
                    )
                }
            } catch (e: Exception) {
                token.setAttribute(
                    attrtype.name,
                    NonFungibleToken.Attribute(attrtype.name!!, attrtype.label!!, value, "unsupported encoding")
                )
            }
        }
    }

    private fun addFunctionInputs(fd: FunctionDefinition, eth: Element) {
        var n: Node? = eth.getFirstChild()
        while (n != null) {
            if (n.getNodeType() != NodeConsts.ELEMENT_NODE) {
                n = n.getNextSibling()
                continue
            }
            val input: Element = n as Element
            when (input.getLocalName()) {
                "data" -> processDataInputs(fd, input)
                "to", "value" -> {
                    if (fd.tx == null)
                        fd.tx = EthereumTransaction()
                    fd.tx!!.args[input.getLocalName()] = parseTxTag(input)
                }
                else -> {}
            }
            n = n.getNextSibling()
        }
    }

    private fun parseTxTag(input: Element): TokenscriptElement {
        val tse = TokenscriptElement()
        tse.ref = input.getAttribute("ref")
        tse.value = input.getTextContent()
        tse.localRef = input.getAttribute("local-ref")
        return tse
    }

    private fun processDataInputs(fd: FunctionDefinition, input: Element) {
        var n: Node? = input.getFirstChild()
        while (n != null) {
            if (n.getNodeType() != NodeConsts.ELEMENT_NODE) {
                n = n.getNextSibling()
                continue
            }
            val inputElement: Element = n as Element
            val arg = MethodArg()
            arg.parameterType = inputElement.getLocalName()
            arg.element = parseTxTag(inputElement)
            fd.parameters.add(arg)
            n = n.getNextSibling()
        }
    }

    fun parseField(tokenId: BigInteger, token: NonFungibleToken) {

        for (key in attributes.keys) {

            val attrtype: Attribute = attributes[key]!!
            var value = BigInteger(0)

            try {
                if (attrtype.function != null) {
                    //obtain this from the function return, can't get it here
                    token.setAttribute(
                        attrtype.name,
                        NonFungibleToken.Attribute(attrtype.name!!, attrtype.label!!, value, "unsupported encoding")
                    )
                } else {
                    value = tokenId.and(attrtype.bitmask).shr(attrtype.bitshift)
                    token.setAttribute(
                        attrtype.name,
                        NonFungibleToken.Attribute(attrtype.name!!, attrtype.label!!, value, attrtype.toString(value))
                    )
                }
            } catch (e: Exception) {
                token.setAttribute(
                    attrtype.name,
                    NonFungibleToken.Attribute(attrtype.name!!, attrtype.label!!, value, "unsupported encoding")
                )
            }
        }
    }

    /**
     * Legacy interface for AppSiteController
     * Check for 'cards' attribute set
     * @param tag
     * @return
     */
    fun getCardData(tag: String): String? {
        val view: TSTokenView? = tokenViews.views.get("view")
        return if (tag == "view") view?.tokenView else if (tag == "style") view?.style else null
    }

    fun hasTokenView(): Boolean {
        return tokenViews.views.size > 0
    }

    val views: String
        get() {
            val sb = StringBuilder()
            var first = true
            for (s in tokenViews.views.keys) {
                if (!first) sb.append(",")
                sb.append(s)
                first = false
            }
            return sb.toString()
        }

    fun getTokenView(viewTag: String): String? {
        return tokenViews.getView(viewTag)
    }

    fun getTokenViewStyle(viewTag: String): String? {
        return tokenViews.getViewStyle(viewTag)
    }

    val tokenViewLocalAttributes: Map<String, Any>
        get() = tokenViews.localAttributeTypes

    fun getSelection(id: String): TSSelection? {
        return selections[id]
    }

    companion object {
        const val TOKENSCRIPT_CURRENT_SCHEMA = "2020/06"
        const val TOKENSCRIPT_REPO_SERVER = "http://localhost:8080/"
        const val TOKENSCRIPT_NAMESPACE = "http://tokenscript.org/" + TOKENSCRIPT_CURRENT_SCHEMA + "/tokenscript"
        private const val ATTESTATION = "http://attestation.id/ns/tbml"
        private const val TOKENSCRIPT_BASE_URL = "http://tokenscript.org/"
        const val TOKENSCRIPT_ERROR = "<h2 style=\"color:rgba(207, 0, 15, 1);\">TokenScript Error</h2>"
        private const val LEGACY_WARNING_TEMPLATE =
            "<html>" + TOKENSCRIPT_ERROR + "<h3>ts:\${ERR1} is deprecated.<br/>Use ts:\${ERR2}</h3>"
    }
}
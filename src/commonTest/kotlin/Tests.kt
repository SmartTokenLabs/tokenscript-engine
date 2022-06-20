
import com.soywiz.kbignum.BigInt
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import nl.adaptivity.xmlutil.dom.*
import nl.adaptivity.xmlutil.serialization.ElementSerializer
import nl.adaptivity.xmlutil.serialization.XML
import org.tokenscript.engine.TSEngine
import org.tokenscript.engine.TestHttp
import org.tokenscript.engine.ethereum.EthRPC
import org.tokenscript.engine.token.entity.ContractInfo
import org.tokenscript.engine.repo.TSRepo
import org.tokenscript.engine.repo.sources.ScriptURI
import kotlin.test.*

class Tests {

    val testBasePath: String = "testdata"

    /*@OptIn(ExperimentalCoroutinesApi::class)
    @Test
    fun testHttpCall() = runTest {

        println("Test HTTP call")

        val res : String = TestHttp.getJsonData();

        println(res)

        assertTrue(res.toString().isNotEmpty())
    }*/

    @OptIn(ExperimentalCoroutinesApi::class)
    @Test
    fun testJsonDataClass() = runTest {

        println("Test HTTP call")

        val res = TestHttp.getJsonDataClass();

        println(res.toString())

        assertTrue(res.toString().isNotEmpty())
    }

    @Test
    fun xmlParsingTest() {

        val xml = XML {
            repairNamespaces = true
            autoPolymorphic = false
        }

        var string = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                "<StringWithMarkup xmlns=\"https://pubchem.ncbi.nlm.nih.gov/pug_view\">\n" +
                "    <String>Chloroacetic acid, &gt;=99% &lt; 100%</String>\n" +
                "</StringWithMarkup>";

        //string = string.normalize()

        val doc: Element = xml.decodeFromString(ElementSerializer, string)

        println("Tag: " + doc.getTagName())
        println("Namespace: " + doc.getNamespaceURI())
        println("Children: " + doc.getChildNodes().getLength())

        val it = doc.getChildNodes().iterator()

        while (it.hasNext()){
            val node = it.next()

            if (node.getNodeType() != NodeConsts.ELEMENT_NODE)
                continue;

            println("Child tag: " + node.getNodeName())
            println("Child content: " + node.getTextContent())
        }
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    @Test
    fun TokenFetchTest() = runTest {

        val tsFile = TSRepo().resolveTokenscript("0xd0d0b327f63a523eed41751e6344dc574b874e02")

        assertNotNull(tsFile)
    }


    @Test
    fun TokenRepoTest() = runTest {

        val token = TSRepo().getTokenDefinition("0xd0d0b327f63a523eed41751e6344dc574b874e02")

        assertNotNull(token)

        assertTrue(token.attributes.keys.isNotEmpty())

        for (contractName in token.contracts.keys) {
            assertNotEquals(0, contractName!!.length)
        }

        // test contract address extraction
        val holdingContract: String? = token.holdingToken

        val ci: ContractInfo = token.contracts.get(holdingContract)!!

        assertTrue(token.contracts.isNotEmpty()) //we have at least one address

        for (networkId in ci.addresses.keys) {
            for (address in ci.addresses.get(networkId)!!) {
                assertEquals(40 + 2, address.length)
            }
        }
    }

    @Test
    fun testDefinitionStorageReadAndWrite() = runTest {
        val engine = TSEngine(testBasePath)
        val testText = "Testing write"

        engine.defStorageProvider.writeDefinition("0x0000", testText)

        val res: String? = engine.defStorageProvider.readDefinition("0x0000")

        assertEquals(res, testText)
    }

    @Test
    fun testRPCCall() = runTest {

        val res = EthRPC().rpcCall("0xf19c56362cfdf66f7080e4a58bf199064e57e07c", "name", emptyList()){
            result -> result[0] as String
        }

        println(res)

        assertEquals("STLTestNFTs", res)
    }


    @Test
    fun testRPCCallWithParams() = runTest {

        val res = EthRPC().rpcCall("0xf19c56362cfdf66f7080e4a58bf199064e57e07c", "tokenURI", listOf(
            Pair("uint256", BigInt(1))
        )
        ) { result ->
            result[0] as String
        }

        println(res)

        assertEquals("https://ipfs.moralis.io:2053/ipfs/QmTjbbr6joJoVz4aUUV7b69msgRNRwZsidG9rMqr7y7Emw", res)
    }

    @Test
    fun testScriptUriRepoSource() = runTest {

        val token = ScriptURI.getTokenscriptXml("0x324ef903ee321bc0ccf9afbe4f5d0773930239e3")

        assertNotNull(token)
    }
}
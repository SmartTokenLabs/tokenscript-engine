package org.tokenscript.engine.adaptors

import kotlinx.serialization.json.*
/*import com.soywiz.kbignum.BigInt
import dev.icerock.moko.web3.*
import dev.icerock.moko.web3.contract.SmartContract
import io.ktor.client.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.serializer

actual class EthRPC actual constructor() {

 actual suspend fun rpcCall(contract:String, function:String, params:List<Pair<String, String>>): JsonObject {

     val json = Json { prettyPrint = true };

     val web3 = Web3(HttpClient(), json, "https://eth-rinkeby.alchemyapi.io/v2/7ZDwrf6n_n4FNaDeBblOpwMSSdHWvqjh");

     val contractAddress = ContractAddress("0xf19c56362cfdf66f7080e4a58bf199064e57e07c");

     //val function = Keccak.digest("tokenUri(uint256)".encodeToByteArray(), KeccakParameter.KECCAK_256);
     val tokenId = BigInt("1".toInt())

     val abi: JsonArray = json.decodeFromString(json.serializersModule.serializer(), """
         [
            {
              "inputs": [
                {
                  "internalType": "uint256",
                  "name": "tokenId",
                  "type": "uint256"
                }
              ],
              "name": "tokenURI",
              "outputs": [
                {
                  "internalType": "string",
                  "name": "",
                  "type": "string"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            }
         ]
     """.trimIndent());

     val contractApi = SmartContract(web3, contractAddress, abi);

     println("RPC contract call: ");

     val res: JsonElement = contractApi.read("tokenURI", listOf(tokenId), fun(mapping: List<Any?>): JsonElement {
        println(mapping.toString())
        return JsonObject(
            mapOf(
                "test" to JsonPrimitive(mapping.toString())
            )
        )
     });

     println("RPC contract call: ");
     println(json.encodeToString(res))

     /*RlpEncoder.encode(listOf(function));

     val req: JsonObject = JsonObject(
         mapOf(
             "to" to JsonPrimitive(contractAddress.value),
             "data" to JsonPrimitive("")
         )
     );

     val req2 = ContractRPC("0xf19c56362cfdf66f7080e4a58bf199064e57e07c", null, data, null);

     val res: JsonElement = web3.call(req2, JsonElement.serializer());*/

     return res.jsonObject

     return JsonObject(mapOf());
 }

}*/
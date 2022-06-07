package org.tokenscript.engine.adaptors

import kotlinx.serialization.json.*
import dev.icerock.moko.web3.*
import dev.icerock.moko.web3.contract.SmartContract
import io.ktor.client.*
import kotlinx.serialization.encodeToString

actual class EthRPC actual constructor() {

 actual suspend fun rpcCall(contract:String, function:String, params:List<Pair<String, String>>): String {

     val json = Json { prettyPrint = true };

     val web3 = Web3(HttpClient(), json, "https://eth-rinkeby.alchemyapi.io/v2/7ZDwrf6n_n4FNaDeBblOpwMSSdHWvqjh");

     val contractAddress = ContractAddress(contract);

     val abi = JsonArray(listOf(
         JsonObject(mapOf(
             "name" to JsonPrimitive(function),
             "inputs" to JsonArray(emptyList()),
             "outputs" to JsonArray(listOf(
                 JsonObject(mapOf(
                     "name" to JsonPrimitive(""),
                     "type" to JsonPrimitive("string"),
                     "internalType" to JsonPrimitive("string")
                 ))
             ))
         ))
     ))

     val contractApi = SmartContract(web3, contractAddress, abi);

     println("RPC contract call: ");

     val res: String = contractApi.read("name", emptyList()){
         name -> name as List<String>
     }[0]

     println(json.encodeToString(res))

     return res
 }

}
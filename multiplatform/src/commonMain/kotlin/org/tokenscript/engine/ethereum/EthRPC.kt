package org.tokenscript.engine.ethereum

import kotlinx.serialization.json.*
import dev.icerock.moko.web3.*
import dev.icerock.moko.web3.contract.SmartContract
import io.ktor.client.*

class EthRPC {

	suspend fun <T> rpcCall(contract:String, function:String, params:List<Pair<String, Any>>, mapper: (List<Any?>) -> T): T {

		val json = Json { prettyPrint = true };

		val web3 = Web3(HttpClient(), json, "https://eth-rinkeby.alchemyapi.io/v2/7ZDwrf6n_n4FNaDeBblOpwMSSdHWvqjh");

		val contractAddress = ContractAddress(contract);

		val paramList = MutableList(params.size){
			val type = params.get(it).first
			JsonObject(mapOf(
				"name" to JsonPrimitive(""),
				"type" to JsonPrimitive(type),
				"internalType" to JsonPrimitive(type)
			))
		}


		val abi = JsonArray(listOf(
			JsonObject(mapOf(
				"name" to JsonPrimitive(function),
				"inputs" to JsonArray(paramList),
				"outputs" to JsonArray(listOf(

					JsonObject(mapOf(
						"name" to JsonPrimitive(""),
						"type" to JsonPrimitive("string"),
						"internalType" to JsonPrimitive("string")
					))
				))
			))
		))

		println(abi.toString())

		val contractApi = SmartContract(web3, contractAddress, abi)

		val res = contractApi.read(function, params.map{ it.second }){
			mapper(it)
		}

		return res
	}

}
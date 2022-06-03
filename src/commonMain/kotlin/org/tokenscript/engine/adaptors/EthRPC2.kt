package org.tokenscript.engine.adaptors

import io.ktor.client.*
import io.ktor.client.features.json.*
import io.ktor.client.features.json.serializer.*
import io.ktor.client.request.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

class EthRPC2 {

    suspend fun rpcCall(contract:String, function:String, params:List<Pair<String, String>>) : JsonObject {

        val httpClient = HttpClient {
            install(JsonFeature) {
                serializer = KotlinxSerializer()
            }
        }

        val json = kotlinx.serialization.json.Json { prettyPrint = true };

        val url = "https://eth-rinkeby.alchemyapi.io/v2/7ZDwrf6n_n4FNaDeBblOpwMSSdHWvqjh"

        val req = JsonObject(
            mapOf(
                "jsonrpc" to JsonPrimitive("2.0"),
                "method" to JsonPrimitive("eth_call"),
                "params" to JsonObject(
                    mapOf(
                        "to" to JsonPrimitive(contract),
                        "org/tokenscript/library/datatokenscript/library/data" to JsonPrimitive(getCallData(function, params))
                    )
                )
            )
        );

        val res: JsonObject = httpClient.post(url){
            body = json.encodeToString(req);
        }

        return res;
    }

    fun getCallData(function:String, params:List<Pair<String, String>>): String {



        return ""
    }
}
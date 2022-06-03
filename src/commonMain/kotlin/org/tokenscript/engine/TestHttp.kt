package org.tokenscript.engine

import io.ktor.client.*
import io.ktor.client.features.json.*
import io.ktor.client.features.json.serializer.*
import io.ktor.client.request.*
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlin.js.ExperimentalJsExport
import kotlin.js.JsExport

object TestHttp {

    suspend fun getJsonData() : String {
        return getJsonDataObject().toString();
    }

    suspend fun getJsonDataObject() : JsonObject {

        val httpClient = HttpClient {
            install(JsonFeature) {
                serializer = KotlinxSerializer()
            }
        }

        return httpClient.get("https://testnets-api.opensea.io/api/v1/asset/0xf19c56362cfdf66f7080e4a58bf199064e57e07c/0/") {
            this.header("Accept", "application/json")
        }
    }

    suspend fun getJsonDataClass(): OpenSeaTokenData {

        val httpClient = HttpClient {
            install(JsonFeature) {
                serializer = KotlinxSerializer(kotlinx.serialization.json.Json {
                    isLenient = true
                    ignoreUnknownKeys = true
                })
            }
        }


        return httpClient.get("https://testnets-api.opensea.io/api/v1/asset/0xf19c56362cfdf66f7080e4a58bf199064e57e07c/0/") {
            this.header("Accept", "application/json")
        }
    }

    fun testFunction() : Int {
        return 1;
    }
}

@OptIn(ExperimentalJsExport::class)
@JsExport
@Serializable
data class OpenSeaTokenData(
    val id: Int,
    @SerialName("token_id")
    val tokenId: String,
    val name: String,
    val description: String,
    @SerialName("image_url")
    val imageUrl: String
)
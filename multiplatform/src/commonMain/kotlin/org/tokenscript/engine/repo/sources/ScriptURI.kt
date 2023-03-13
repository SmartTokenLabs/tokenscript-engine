package org.tokenscript.engine.repo.sources

import io.ktor.client.*
import io.ktor.client.request.*
import org.tokenscript.engine.ethereum.EthRPC

object ScriptURI: TSSourceInterface {

    private const val IPFS_GATEWAY = "https://ipfs.io/ipfs/"
    
    override suspend fun getTokenscriptXml(contract: String): String {

        var url = EthRPC().rpcCall(contract, "scriptURI", emptyList()){
            result -> result[0] as String
        }

        println("RPC Result: " + url)

        if (url.startsWith("ipfs://"))
            url = url.replace("ipfs://", IPFS_GATEWAY)

        val httpClient = HttpClient()

        return httpClient.get(url) {
            //this.header("Accept", "application/tokenscript+xml")
        }
    }
}
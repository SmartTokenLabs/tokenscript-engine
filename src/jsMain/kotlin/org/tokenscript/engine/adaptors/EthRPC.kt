package org.tokenscript.engine.adaptors

actual class EthRPC actual constructor() {

    actual suspend fun rpcCall(
        contract: String,
        function: String,
        params: List<Pair<String, String>>
    ): String {
        TODO("Not yet implemented")
    }

}
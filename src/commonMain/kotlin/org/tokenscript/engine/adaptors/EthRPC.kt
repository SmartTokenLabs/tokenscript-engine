package org.tokenscript.engine.adaptors

expect class EthRPC() {

    suspend fun rpcCall(contract:String, function:String, params:List<Pair<String, String>>) : String

}
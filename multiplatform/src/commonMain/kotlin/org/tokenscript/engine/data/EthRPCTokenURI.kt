package org.tokenscript.engine.data

import kotlinx.serialization.json.JsonObject

class EthRPCTokenURI: DataSourceInterface {

    override fun getData(): JsonObject {

        /*val transaction = createEmptyTransaction();
        transaction.chain = BigInteger.valueOf(4);
        transaction.to = Address("0xf19c56362cfdf66f7080e4a58bf199064e57e07c")

        val function = ERC681()
        function.function = "tokenURI"
        function.functionParams = listOf(Pair("uint256", "1")) // tokenId

        transaction.input = function.toTransactionInput();

        val rpc = HttpEthereumRPC("https://eth-rinkeby.alchemyapi.io/v2/7ZDwrf6n_n4FNaDeBblOpwMSSdHWvqjh")
        val output: HexString? = rpc.call(transaction)

        println("RPC Output:")
        println(output?.string)

        if (output != null){

            var strip = output.string.substring(2)
            val offset = strip.substring(0, 64).replace(Regex("^0+"), "").toInt(16)
            val length = strip.substring(64, 128).replace(Regex("^0+"), "").toInt(16)

            println("Offset: " + offset)
            println("Length: " + length)
            val data = strip.substring(128)

            val decoded = decode(data.substring(0, (length * 2))).toString(Charsets.UTF_8)
            println("Decoded:")
            println(decoded)

            val res = khttp.get(decoded)

            return res.jsonObject
        }*/

        throw Exception("Failed to get RPC/IPFS data")
    }
}
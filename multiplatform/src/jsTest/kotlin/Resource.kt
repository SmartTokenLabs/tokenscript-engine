
private external fun require(module: String): dynamic
// FS module not available in browser tests
//private val fs = require("fs")

actual class Resource actual constructor(actual val name: String) {
    private val path = "$RESOURCE_PATH/$name"

    //actual fun exists(): Boolean = fs.existsSync(path) as Boolean
    actual fun exists(): Boolean = throw NotImplementedError()

    //actual fun readText(): String = fs.readFileSync(path, "utf8") as String
    actual fun readText(): String = throw NotImplementedError()
}
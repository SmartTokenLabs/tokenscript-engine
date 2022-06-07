import org.tokenscript.engine.storage.DefaultKeyValueStorage
import org.tokenscript.engine.storage.DefinitionStorageInterface

class DefaultDefinitionStorage(basePath: String): DefinitionStorageInterface, DefaultKeyValueStorage(basePath, "xml") {

    // This is used to put files in nested folders and to distinguish between different data sets.
    var path: String = "tse-def"

    override fun readDefinition(tsId: String): String? {
        return readValue("$path/$tsId")
    }

    override fun writeDefinition(tsId: String, data: String) {
        writeValue("$path/$tsId", data)
    }

}
package org.tokenscript.engine.data

import kotlinx.serialization.json.JsonObject

interface DataSourceInterface {

    fun getData(): JsonObject
}
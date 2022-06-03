package org.tokenscript.engine.token.entity

/**
 * Created by JB on 27/07/2020.
 */
class TSOrigins private constructor() {
    private var type: TSOriginType? = null
    var originName: String? = null
        private set
    private var event: EventDefinition? = null

    class Builder(type: TSOriginType) {
        private val type: TSOriginType
        private var originName: String? = null
        private var ev: EventDefinition?

        init {
            this.type = type
            ev = null
        }

        fun name(name: String?): Builder {
            originName = name
            return this
        }

        fun event(event: EventDefinition?): Builder {
            ev = event
            return this
        }

        @Throws(Exception::class)
        fun build(): TSOrigins {
            val origins = TSOrigins()
            origins.type = type
            if (originName == null) throw Exception("Origins must have contract or type field.")
            origins.originName = originName
            if (type === TSOriginType.Event && ev == null) {
                throw Exception("Event origin must have Filter spec.")
            }
            origins.event = ev
            return origins
        }
    }

    val originEvent: EventDefinition?
        get() = event

    fun isType(checkType: TSOriginType): Boolean {
        return type === checkType
    }
}
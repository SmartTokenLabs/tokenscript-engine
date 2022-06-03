package org.tokenscript.engine.token.entity

class BadContract : Exception {
    constructor() {}
    constructor(message: String?) : super(message) {}
}
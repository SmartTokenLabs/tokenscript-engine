package org.tokenscript.engine.token.entity

/**
 * Created by weiwu on 12/3/18.
 */
class SalesOrderMalformed : Exception {
    // Parameterless Constructor
    constructor() {}

    // Constructor that accepts a message
    constructor(message: String?) : super(message) {}
}
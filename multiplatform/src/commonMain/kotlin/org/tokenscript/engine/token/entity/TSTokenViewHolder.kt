package org.tokenscript.engine.token.entity

/**
 * Created by JB on 8/05/2020.
 */
class TSTokenViewHolder {
    var localAttributeTypes: MutableMap<String, Attribute> = HashMap()
    var views: MutableMap<String, TSTokenView> = HashMap()
    var globalStyle = ""
    fun getView(viewName: String): String? {
        val v: TSTokenView? = views[viewName]
        return if (v != null) v.tokenView else null
    }

    fun getViewStyle(viewName: String): String? {
        val v: TSTokenView? = views[viewName]
        return if (v != null) globalStyle + v.style else null
    }
}
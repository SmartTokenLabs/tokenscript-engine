package org.tokenscript.engine.token.entity

/**
 * Created by JB on 27/07/2020.
 */
class TSActivityView(origins: TSOrigins) {
    private val eventOrigins: TSOrigins

    //views
    private val tokenViews: TSTokenViewHolder = TSTokenViewHolder()

    init {
        eventOrigins = origins
    }

    fun addView(viewName: String, view: TSTokenView) {
        tokenViews.views.put(viewName, view)
    }

    /**
     * Gets the corresponding view
     * @param viewType either 'item-view' or 'view'
     * @return
     */
    fun getView(viewType: String): TSTokenView {
        return tokenViews.views.get(viewType)!!
    }

    val eventName: String?
        get() = eventOrigins.originName
    val activityFilter: String?
        get() = eventOrigins.originEvent?.filter
}
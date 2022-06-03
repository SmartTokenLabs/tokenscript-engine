package org.tokenscript.engine.token.entity

/**
 * Created by JB on 23/05/2020.
 */
object EvaluateSelection {
    private const val STACK_CHECK = 10
    fun evaluate(head: TSFilterNode, attrs: Map<String?, TokenScriptResult.Attribute>): Boolean {
        //evaluate from bottom up
        //evaluate each leaf logic
        //unevaluate all logic
        unevaluateAllNodes(head)
        evaluateLeafNodes(head, attrs)
        var stackCheck = STACK_CHECK //prevent infinite loop in case of error
        while (stackCheck > 0 && head.logic === TSFilterNode.LogicState.NONE) {
            evaluateLogic(head)
            stackCheck--
        }
        return head.logic === TSFilterNode.LogicState.TRUE
    }

    private fun unevaluateAllNodes(node: TSFilterNode?) {
        if (node!!.isNodeLogic || node!!.isLeafLogic) {
            node!!.logic = TSFilterNode.LogicState.NONE
        }
        if (node!!.first != null) {
            unevaluateAllNodes(node!!.first)
        }
        if (node!!.second != null) {
            unevaluateAllNodes(node!!.second)
        }
    }

    private fun evaluateLogic(node: TSFilterNode?) {
        //start evaluating logic nodes, start from the bottom
        if (node!!.isNodeLogic) {
            //check that children have been evaluated
            if (node.first!!.isEvaluated && node.second!!.isEvaluated) {
                node.logic = node.evaluate()
            }
        }
        if (node.first != null) {
            evaluateLogic(node.first)
        }
        if (node.second != null) {
            evaluateLogic(node.second)
        }
    }

    private fun evaluateLeafNodes(node: TSFilterNode?, attrs: Map<String?, TokenScriptResult.Attribute>) {
        if (node!!.isLeafLogic) {
            //evaluate
            node.logic = node.evaluate(attrs)
        }
        if (node.first != null) {
            evaluateLeafNodes(node.first, attrs)
        }
        if (node.second != null) {
            evaluateLeafNodes(node.second, attrs)
        }
    }
}
import {ITokenIdContext, ITokenScript} from "../../../ITokenScript";
import {Attributes} from "../../Attributes";
import {AbstractDependencyBranch} from "../AbstractDependencyBranch";

/**
 * Filter value represent a single dynamic value used in the construction of an event filter
 */
export class FilterValue extends AbstractDependencyBranch {

	constructor(tokenScript: ITokenScript, ref, type?: string, localAttrContext?: Attributes) {
		super(tokenScript, localAttrContext);
		this.type = type;
		this.ref = ref;
	}

	/**
	 * Resolve the filter value
	 * @param tokenContext
	 * @protected
	 */
	protected async resolveValue(tokenContext?: ITokenIdContext){

		const attr = this.getBackingAttribute();

		return await attr.getValue(true, false, false, tokenContext);
	}
}

import {ISecurityInfo} from "../SecurityInfo";
import {TokenScript} from "../../TokenScript";

/**
 * This interface can be implemented to add more TokenScript validation methods
 */
export interface IScriptValidator {
	/**
	 * Returns IValidator result or false if validation isn't applicable (i.e. missing DSIG)
	 * @param tokenScript
	 * @param sourceUrl
	 * @param xmlStr
	 */
	validate(tokenScript: TokenScript, sourceUrl: string, xmlStr: string): Promise<Partial<ISecurityInfo>|false>
}

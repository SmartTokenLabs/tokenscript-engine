import {ITokenIdContext, TokenScript} from "../../../TokenScript";
import {Attributes} from "../../Attributes";
import {EthUtils} from "../../../ethereum/EthUtils";
import {AbstractDependencyBranch} from "../AbstractDependencyBranch";
import {ITokenContextData} from "../../../tokens/ITokenContextData";

export interface IArgument {
	type: string;
	content?: string;
	ref?: string;
	localRef?: string;
}

/**
 * Argument represents arguments sent to an ethereum function or transaction. These are defined within the ts:data element.
 * They can be static or use the value of a special reference or another attribute.
 */
export class Argument extends AbstractDependencyBranch implements IArgument {

	type: string;
	content?: string;
	ref?: string;
	localRef?: string;

	constructor(tokenScript: TokenScript, argDef: Element, type?: string, localAttrContext?: Attributes) {
		super(tokenScript, localAttrContext);
		this.type = type ? type : argDef.tagName.split(":")[1];
		this.content = argDef.textContent;
		this.ref = argDef.getAttribute("ref");
		this.localRef = argDef.getAttribute("local-ref");
	}

	/**
	 * Resolve the argument value. In the case of arguments, they can reference a special value or attribute by using the XML ref or local-ref attributes
	 * @param tokenContext
	 * @protected
	 */
	protected async resolveValue(tokenContext?: ITokenIdContext){

		let value;

		if (this.ref || this.localRef){

			// First, check if values is provided in TokenContextData
			const contextData = await this.tokenScript.getTokenContextData(tokenContext);

			if (contextData[this.ref]) {
				value = contextData[this.ref];

				// Special case for encoding attestations into struct argument
				if (this.type === "struct")
					return this.encodeStruct(this.ref, contextData);

			} else {
				value = await this.resolveFromAttribute(tokenContext);
			}

		} else {
			value = this.content;
		}

		return EthUtils.encodeTransactionParameter(this.type, value);
	}

	private async encodeStruct(name: string, contextData: ITokenContextData){

		switch (name){
			case "attestation":
				const signedAttestation = contextData.tokenInfo.decodedToken;
				const attestStructData = {};

				for (const field of signedAttestation.types.Attest){
					attestStructData[field.name] = signedAttestation.message[field.name];
				}

				return attestStructData;

			default:
				throw new Error("Struct encoding is not defined for " + this.ref + " attribute.");
		}
	}

	private async resolveFromAttribute(tokenContext?: ITokenIdContext){

		let attr;

		// TODO: Rework this to avoid exception and put into getBackingAttribute function to cover filter values
		try {
			attr = this.getBackingAttribute();
			return await attr.getValue(true, false, tokenContext);

		} catch (e){
			// local-ref can be used to get attributes defined by a view that aren't explicitly defined in the tokenscript
			const value = this.tokenScript.getViewController().getUserEntryValue(this.localRef);

			if (!value){
				throw e;
			}

			return value;
		}
	}
}

import {EthUtils, IEthersArgument} from "../../../ethereum/EthUtils";
import {ITokenContextData} from "../../../tokens/ITokenContextData";
import {ITokenIdContext, ITokenScript} from "../../../ITokenScript";
import {Attributes} from "../../Attributes";
import {Contract} from "../../Contract";
import {AbstractDependencyBranch} from "../AbstractDependencyBranch";

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

	constructor(tokenScript: ITokenScript, argDef: Element, type?: string, localAttrContext?: Attributes) {
		super(tokenScript, localAttrContext);
		this.type = type ? type : argDef.tagName.split(":")[1];
		this.content = argDef.textContent;
		this.ref = argDef.getAttribute("ref");
		this.localRef = argDef.getAttribute("local-ref");
	}

	public getName(){
		return this.localRef ?? this.ref;
	}

	/**
	 * Get the ethers argument data for this argument
	 */
	public async getEthersArgument(tokenContext: ITokenIdContext, functionName: string, contract: Contract){

		let overrideValue;

		if (this.ref === "attestation"){
			const ctx = await this.tokenScript.getTokenContextData(tokenContext);
			overrideValue = ctx.tokenInfo.data.decodedToken.message
		}

		let arg: Partial<IEthersArgument> = {
			name: this.getName(),
			value: overrideValue ?? await this.getValue(tokenContext)
		};

		if (this.type === "struct" || this.type === "abi"){

			switch (this.ref){
				case "attestation":
					if (this.type === "struct") {
						const data = await this.tokenScript.getTokenContextData(tokenContext);

						arg.type = "tuple";
						arg.internalType = "struct EasTicketVerify.AttestationCoreData";
						arg.components = data.tokenInfo.data.decodedToken.types.Attest.map((field) => {
							return {
								name: field.name,
								type: field.type,
								internalType: field.type
							}
						})

						break;
					}

				// fall-through intended
				default:

					const abi = contract.getAbi("function", functionName);

					//console.log("ABI: ", abi);

					if (abi.length){
						const abiArg = abi[0].inputs.find((arg: any) => {
							return arg.name == this.localRef || arg.name == this.ref;
						});

						if (abiArg){
							arg.type = abiArg.type;
							arg.internalType = abiArg.internalType;
							arg.components = abiArg.components;
							break;
						}
					}

					throw new Error(`Struct or ABI encoding is not defined for ${this.localRef ?? this.ref} arg in contract ${contract.getName()} method ${functionName}`);
			}
		} else {
			arg.type = this.type;
			arg.internalType = this.type;
		}

		return arg
	}

	/**
	 * Resolve the argument value. In the case of arguments, they can reference a special value or attribute by using the XML ref or local-ref attributes
	 * @param tokenContext
	 * @protected
	 */
	protected async resolveValue(tokenContext?: ITokenIdContext){

		let value;

		if (this.ref || this.localRef){

			if (tokenContext)
				value = await this.resolveUsingTokenContext(tokenContext);

			if (!value)
				value = await this.resolveFromAttribute(tokenContext);

		} else {
			value = this.content;
		}

		return EthUtils.encodeTransactionParameter(this.type, value);
	}

	private async resolveUsingTokenContext(tokenContext?: ITokenIdContext){

		const contextData = await this.tokenScript.getTokenContextData(tokenContext);

		// TODO: support dot notation to access nested data in transactions
		if (!contextData[this.ref])
			return null;

		// Special case for encoding attestations into struct argument
		if (this.type === "struct") {
			return this.encodeStruct(this.ref, contextData);
		} else {
			return contextData[this.ref];
		}
	}

	private async encodeStruct(name: string, contextData: ITokenContextData){

		switch (name){
			case "attestation":
				const signedAttestation = contextData.tokenInfo.data.decodedToken;
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
			const value = this.tokenScript.getViewController().getUserEntryValue(this.localRef, tokenContext?.selectedTokenId ?? "-1");

			if (value === undefined){
				throw e;
			}

			return value;
		}
	}
}

import {ITokenIdContext, TokenScript} from "../TokenScript";
import {Arguments} from "./data/function/Arguments";
import {Attributes} from "./Attributes";
import {EthUtils} from "../ethereum/EthUtils";
import {BigNumber} from "bignumber.js";
import {FilterQuery} from "./data/event/FilterQuery";
import {AbstractDependencyBranch} from "./data/AbstractDependencyBranch";
import {Label} from "./Label";

interface TokenAttributeValue {
	[tokenId: string]: any
}

/**
 * Attribute represents ts:attribute that can be included in a global context (within ts:token) or within a single card (ts:card)
 * It encapsulates the logic for resolving & caching attribute values from various sources, as well as invalidation & other dependency tree operations
 * The result of an attribute can depend on multiple levels of dependencies, each coming from a different origin (source).
 * This can be complex but the analogy of a tree is useful for this as it allows us to prevent repetition and only invalidate cache when required.
 */
export class Attribute {

	private static NO_DEPENDENCY_ORIGINS = ["ts:user-entry", "ts:data"];

	private label?: Label;
	private asType?: string;
	private scopeValues: TokenAttributeValue = {};

	private dependsOnTokenId = undefined;

	private resolveLocks: {[scopeId: string]: Promise<unknown>} = {};

	constructor(private tokenScript: TokenScript, private attributeDef: Element, private localAttrContext: Attributes) {
		// TODO: ensure that attribute arguments don't have circular dependencies
	}

	/**
	 * The name of the attribute. This should be unique for each ts:attribute element in the TokenScript file
	 */
	public getName(){
		return this.attributeDef.getAttribute("name");
	}

	/**
	 * The label for the attribute
	 */
	public getLabel(){

		if (!this.label)
			this.label = new Label(this.attributeDef);

		return this.label.getValue() ?? this.getName();
	}

	/**
	 * The origin of the attribute
	 */
	public getOrigins(){
		return this.attributeDef.getElementsByTagName("ts:origins")[0].children;
	}

	/**
	 * Get the value of the attribute. Each value is cached internally by scopeId (tokenId) until invalidated.
	 * @param throwOnUndefined Throw error when the value resolves to undefined
	 * @param currentValue Fetches the current value, skipping value resolution except in the case of user input
	 * @param bypassLocks If the value is currently being resolved by another caller, this bypasses the pending promise and resolves the value again
	 * @param tokenContext The token context (scopeId) to get the value for. This is only used when this attribute or it's dependencies depend on tokenId as an input
	 */
	// TODO: These arguments are getting a bit wild, they should probably be in an object
	public async getValue(throwOnUndefined = false, currentValue = false, bypassLocks = false,
						  tokenContext: ITokenIdContext = this.tokenScript.getCurrentTokenContext()){

		const scopeId = this.getValueScopeId(tokenContext);

		let value;

		if (this.getScopedValue(scopeId) === undefined){

			const origins = this.getOrigins();

			// TODO: handle multiple origins? (ask james)
			//for (let i in origins.children){}
			const origin = origins[0];
			this.asType = origin.getAttribute("as");

			if (currentValue && origin.tagName !== "ts:user-entry") {
				value = this.getScopedValue(scopeId);
			} else {
				// User entry values are never cached internally within this object
				if (origin.tagName === "ts:user-entry") {
					value = this.tokenScript.getViewController().getUserEntryValue(this.getName(), scopeId);
				} else {

					// TODO: This can probably be improved - it's only here to fix an issue with the ENS renewal screen
					if (!bypassLocks){
						if (!this.resolveLocks[scopeId]){

							this.resolveLocks[scopeId] = new Promise((resolve, reject) => {
								this.resolveAttributeValue(origin, scopeId, tokenContext).then((res) => {
									resolve(res);
									delete this.resolveLocks[scopeId];
								}).catch(e => {
									reject(e);
								});
							});
						}

						value = await this.resolveLocks[scopeId];
					} else {
						value = await this.resolveAttributeValue(origin, scopeId, tokenContext);
					}
				}
			}

		} else {
			value = this.getScopedValue(scopeId);
		}

		if (throwOnUndefined && value === undefined)
			throw new Error("Could not resolve attribute " + this.getName());

		if (value === undefined)
			return value;

		return this.transformValue(value);
	}

	/**
	 * Fetches the current value, skipping value resolution except in the case of user input
	 * This is helpful for rendering the current attribute state and avoids simultaneous requests to resolve attributes
	 */
	public async getCurrentValue(tokenContext: ITokenIdContext = this.tokenScript.getCurrentTokenContext()){
		return this.getValue(false, true, false, tokenContext);
	}

	/**
	 * Applies the transformations for the attribute as defined by the "as" XML attribute
	 */
	private async transformValue(value: any){

		if (!this.asType)
			return value;

		switch (this.asType){
			case "bool":
				if (typeof value === "boolean")
					break;
				return Boolean(value);
			case "e2":
			case "e4":
			case "e6":
			case "e8":
			case "e18":
				return EthUtils.calculateIntValue(value, parseInt(this.asType.substring(1)));
		}

		return value;
	}

	/**
	 * Get the JSON-safe value of the attribute. This converts BigInt objects into integer strings, so it can be sent to the card Javascript
	 * @param bypassLocks
	 */
	public async getJsonSafeValue(bypassLocks?: boolean){
		const value = await this.getValue(false, false, bypassLocks);

		if (typeof value === "bigint")
			return value.toString();

		return value;
	}

	/**
	 * Resolve the attribute value
	 * @param origin The origin element for the attribute
	 * @param scope The scopeId of the request
	 * @param tokenContext The token context for the request
	 * @private
	 */
	private async resolveAttributeValue(origin: Element, scope: string, tokenContext?: ITokenIdContext){

		let resultValue;

		switch (origin.tagName){

			// TODO: Separate ethereum logic out into separate classes implementing an AttributeSource interface
			case "ethereum:call":
			case "ethereum:event":

				console.log("Resolving attribute: " + this.getName() + " for token context " + tokenContext?.selectedTokenId);

				const contract = this.tokenScript.getContractByName(origin.getAttribute("contract"));
				const wallet = await this.tokenScript.getEngine().getWalletAdapter();
				const chain = tokenContext?.chainId ?? await wallet.getChain();
				const contractAddr = contract.getAddressByChain(chain, true);

				let res;

				if (origin.tagName === "ethereum:call") {

					const func = origin.getAttribute("function");

					let outputType = EthUtils.tokenScriptOutputToEthers(this.asType);

					const args = new Arguments(this.tokenScript, origin, this.localAttrContext).getArguments();

					const ethParams = [];

					for (let i in args) {
						ethParams.push(await args[i].getEthersArgument(tokenContext, i.toString()))
					}

					res = await wallet.call(contractAddr.chain, contractAddr.address, func, ethParams, [outputType]);

					console.log("Call result: ", res);

				} else {

					const filter = origin.getAttribute("filter");
					const type = origin.getAttribute("type");
					const fieldToSelect = origin.getAttribute("select");

					// TODO: Move logic for accessing these into a separate class
					const asnModule = this.tokenScript.getAsnModuleDefinition(type);

					if (!asnModule)
						throw new Error("Could not find ASN module with name ");

					const inputs = [];

					const eventFields = asnModule.querySelector("type sequence");
					const filterQuery = new FilterQuery(this.tokenScript, filter, this.localAttrContext);

					for (let field of eventFields.children){
						const name = field.getAttribute("name");
						const type = field.getAttribute("ethereum:type");
						inputs.push({
							name: name,
							type: type,
							internalType: type,
							indexed: field.getAttribute("ethereum:indexed"),
							value: filterQuery.has(name) ? await filterQuery.getValue(name, tokenContext) : null // Filter value
						});
					}

					const events = await wallet.getEvents(chain, contractAddr.address, type, inputs);

					if (events.length === 0)
						break;

					res = events[0].args[fieldToSelect];

					console.log("Event result: ", res);
				}

				if (res instanceof Object) {
					resultValue = BigInt(res);
				} else {
					resultValue = res;
				}

				break;

			case "ts:data":

				const data = origin.children;

				if (data.length > 1){
					throw new Error("Attribute ts:data origin does not support more than one element");
				}

				resultValue = data[0].textContent;

				break;

			default:
				throw new Error("Attribute origin type " + origin.tagName + " is not implemented");
		}

		this.setScopedValue(resultValue, scope);

		return resultValue;
	}

	/**
	 * Get cached attribute value by scopeId
	 * @param scope
	 * @private
	 */
	private getScopedValue(scope: string){
		return this.scopeValues?.[scope];
	}

	/**
	 * Set cache for a specific scopeId
	 * @param value
	 * @param scope
	 * @private
	 */
	private setScopedValue(value: any, scope: string){
		this.scopeValues[scope] = value;
	}

	/**
	 * Gets the scopeId for the request based on the token context.
	 * @param tokenContext
	 * @private
	 * @returns tokenId or -1 when the attribute doesn't depend on tokenId
	 */
	private getValueScopeId(tokenContext: ITokenIdContext){
		let scope = "-1";

		if (this.getDependsOnTokenIdOrIsUserEntry()){
			if (tokenContext?.selectedTokenId)
				scope = tokenContext.selectedTokenId;
		}

		return scope
	}

	/**
	 * Determines whether the attribute depends on tokenId or user input.
	 * This value is cached to prevent unnecessary recalculation of the attribute dependency tree.
	 * @private
	 */
	private getDependsOnTokenIdOrIsUserEntry(){

		if (this.isUserEntry())
			return true;

		if (this.dependsOnTokenId === undefined){

			const userEntryAttrNames = [];

			for (const attr of this.tokenScript.getAttributes()){
				if (attr.isUserEntry())
					userEntryAttrNames.push(attr.getName());
			}

			this.dependsOnTokenId = this.isDependentOn(["tokenId", ...userEntryAttrNames])
		}
		return this.dependsOnTokenId;
	}

	/**
	 * Returns true if the attribute is a user-entry attribute
	 */
	public isUserEntry(){
		const origins = this.getOrigins();
		const origin = origins[0];
		return origin.tagName === "ts:user-entry";
	}

	/**
	 * Invalidate attribute values
	 * @param dependentOn When defined, only invalidate attributes that depend on any of the attributes provided.
	 */
	// TODO: Invalidate by scope
	public invalidate(dependentOn?: string[]){

		if (dependentOn){
			if (!this.invalidateDependencies(dependentOn)) {
				if (dependentOn.indexOf(this.getName()) > -1)
					return false;
				console.log("Attribute '" + this.getName() + "' is not dependent on '" + JSON.stringify(dependentOn) + "', skipping invalidation");
				return false;
			}
		}

		console.log("Invalidating attribute: " + this.getName());

		this.resolveLocks = {};
		this.scopeValues = {};

		return true;
	}

	/**
	 * Determines whether this attribute (or it's dependencies) depend on the values of the supplied attribute names.
	 * It does this by creating an object dependency tree and propagating the first match back up the tree to the calling attribute.
	 * @param dependentOn An array of attribute names
	 */
	public isDependentOn(dependentOn: string[]){

		const dependencies = this.getDependencies();

		if (dependencies === false)
			return false;

		for (let dependency of dependencies){
			if (dependency.isDependentOn(dependentOn))
				return true;
		}

		return dependentOn.indexOf(this.getName()) > -1;
	}

	/**
	 * Invalidate dependencies
	 * @param dependentOn
	 * @private
	 */
	private invalidateDependencies(dependentOn: string[]){

		const dependencies = this.getDependencies();

		if (dependencies === false)
			return false;

		let isInvalidated = false;

		for (let arg of dependencies) {
			isInvalidated = arg.invalidateDependencies(dependentOn);
		}

		return isInvalidated;
	}

	/**
	 * Get immediate dependencies of the current attributes. This function is used to generate dependency trees
	 * for invalidate & isDependentOn methods
	 * @private
	 */
	private getDependencies(){

		const origins = this.getOrigins();

		// TODO: Ask James: How to handle multiple origins? If this is not allowed it needs to be restricted in the schema
		const origin = origins[0];

		if (Attribute.NO_DEPENDENCY_ORIGINS.indexOf(origin.tagName) > -1)
			return false;

		let dependencies: AbstractDependencyBranch[] = [];

		if (origin.tagName === "ethereum:call") {
			dependencies = new Arguments(this.tokenScript, origin, this.localAttrContext).getArguments();
		} else if (origin.tagName === "ethereum:event") {
			const filter = origin.getAttribute("filter");
			dependencies = new FilterQuery(this.tokenScript, filter, this.localAttrContext).getDynamicFilterValues();
		}

		return dependencies;
	}
}

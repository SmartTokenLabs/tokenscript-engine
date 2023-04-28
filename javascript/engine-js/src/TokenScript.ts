import {ScriptSourceType, TokenScriptEngine} from "./Engine";
import {Card} from "./tokenScript/Card";
import {Contract} from "./tokenScript/Contract";
import {Transaction} from "./tokenScript/Transaction";
import {IToken} from "./tokens/IToken";
import {Attributes} from "./tokenScript/Attributes";
import {ViewController} from "./view/ViewController";
import {IViewBinding} from "./view/IViewBinding";
import {SecurityInfo} from "./security/SecurityInfo";
import {Selections} from "./tokenScript/selection/Selections";
import {Label} from "./tokenScript/Label";
import {ITokenDiscoveryAdapter} from "./tokens/ITokenDiscoveryAdapter";

export interface ITokenContext extends IToken {
	selectedNftIndex?: number
	selectedNftId?: string
}

export interface ITokenIdContext {
	chainId: number
	selectedNftId?: string
}

export interface TokenScriptEvents {
	TOKENS_UPDATED: TokensUpdatedEventArgs
	TOKENS_LOADING: void
}

export interface TokensUpdatedEventArgs {
	tokens: TokenMetadataMap
}

export type TokenMetadataMap = { [contractName: string]: IToken };

export interface ITransactionStatus {
	status: 'confirmed'|'submitted',
	txNumber: string,
	txLink?: string,
	txRecord?: any
}

export interface ITransactionListener {
	(data: ITransactionStatus): void|Promise<void>
}

/**
 * The TokenScript object represents a single instance of a TokenScript.
 * The TS XML is parsed into various sub-objects on-demand that roughly reflect the structure of the XML.
 * This class contains various top-level methods for getting TokenScript data, showing TokenScript cards &
 * executing transactions
 */
export class TokenScript {

	private label?: Label;

	private contracts?: { [contractName: string]: Contract };

	private tokenMetadata?: TokenMetadataMap;

	private cards?: Card[];

	private attributes?: Attributes;

	private selections?: Selections;

	private tokenContext?: ITokenContext;

	private viewController?: ViewController;

	private securityInfo: SecurityInfo;

	private eventHandlers: {[eventName: string]: (data: any) => Promise<void>|void} = {};

	private tokenDiscoveryAdapter?: ITokenDiscoveryAdapter;

	constructor(
		private engine: TokenScriptEngine,
		private tokenDef: XMLDocument,
		private xmlStr: string,
		private source: ScriptSourceType,
		private sourceUrl: string,
		private viewBinding?: IViewBinding
	) {
		console.log("TokenScript object constructed");
		this.securityInfo = new SecurityInfo(this, this.tokenDef, this.xmlStr, this.source, this.sourceUrl);
	}

	/**
	 * Emit a TokenScript event to the user-agent
	 * @param eventType
	 * @param params
	 * @private
	 */
	private emitEvent<
		T extends keyof TokenScriptEvents, // <- T points to a key
		R extends (TokenScriptEvents)[T] // <- R points to the type of that key
	>(eventType: T, params?: R) {
		if (this.eventHandlers[eventType])
			this.eventHandlers[eventType](params);
	}

	/**
	 * Register an event listener to receive TokenScript events
	 * @param eventType
	 * @param callback
	 */
	public on<
		T extends keyof TokenScriptEvents, // <- T points to a key
		R extends (data: ((TokenScriptEvents)[T])) => Promise<void>|void // <- R points to the type of that key
	>(eventType: T, callback: R){
		this.eventHandlers[eventType] = callback;
	}

	/**
	 * The instance of TokenScriptEngine that created this TokenScript
	 */
	public getEngine(){
		return this.engine;
	}

	/**
	 * The SecurityInfo object related to this TokenScript
	 */
	public async getSecurityInfo(){
		return await this.securityInfo.getInfo();
	}

	/**
	 * Returns true if a view binding has been provided, false if this is a 'headless' instance of a TokenScript
	 */
	public hasViewBinding(){
		return !!this.viewBinding;
	}

	/**
	 * Set a new view binding for the TokenScript.
	 * @param viewBinding
	 */
	public setViewBinding(viewBinding: IViewBinding){
		this.viewBinding = viewBinding;
		this.viewController = null;
	}

	/**
	 * The current view binding
	 */
	public getViewBinding(){
		return this.viewBinding;
	}

	/**
	 * The view controller exposes methods that can be used to interact with the UI of the TokenScript
	 * - via view binding methods that are implemented by the user-agent.
	 */
	public getViewController(){

		if (!this.viewController){

			if (!this.viewBinding)
				throw new Error("View binding has not been provided");

			this.viewController = new ViewController(this, this.viewBinding);
		}

		return this.viewController;
	}

	/**
	 * Show a card in the UI
	 * @param card The card object to display
	 */
	public async showTokenCard(card: Card){
		await this.getViewController().showCard(card);
	}

	/**
	 * The common name of the TokenScript
	 */
	public getName() {
		return this.tokenDef.documentElement.getAttribute("name");
	}

	/**
	 * The label for the TokenScript
	 */
	public getLabel(){

		if (!this.label)
			this.label = new Label(this.tokenDef.documentElement);

		return this.label.getValue() ?? this.getName() ?? "Unnamed TokenScript";
	}

	/**
	 * An array of cards for the TokenScript
	 */
	public getCards(): Card[] {

		if (!this.cards) {

			let cardsXml = this.tokenDef.documentElement.getElementsByTagName("ts:card");

			this.cards = [];

			for (let i in cardsXml) {

				if (!cardsXml.hasOwnProperty(i))
					continue;

				const card = new Card(this, cardsXml[i]);

				this.cards.push(card);
			}
		}

		return this.cards;
	}

	/**
	 * Load contracts contained in the TokenScript
	 * @private
	 */
	private loadContracts(){

		if (!this.contracts) {

			let contractXml = this.tokenDef.documentElement.getElementsByTagName('ts:contract');

			this.contracts = {};

			for (let i in contractXml) {

				if (!contractXml.hasOwnProperty(i))
					continue;

				const contract = new Contract(contractXml[i]);

				this.contracts[contract.getName()] = contract;
			}

		}
	}

	/**
	 * Contracts for the TokenScript
	 * @param originsOnly
	 */
	public getContracts(originsOnly = false) {

		this.loadContracts();

		if (originsOnly){

			const origins = this.tokenDef.documentElement.getElementsByTagName("ts:origins");
			const originContracts: { [key: string]: Contract } = {};

			for (let i in origins[0].children) {

				const origin = origins[0].children[i];

				if (!origin.tagName) continue;

				if (origin.tagName == "ts:ethereum"){

					const contractName = origin.getAttribute("contract");

					if (this.contracts[contractName]){
						originContracts[contractName] = this.contracts[contractName];
					} else {
						console.warn("Contract with name " + contractName + " could not be found.")
					}
				} else {
					console.warn("Token origin with tag " + origin.tagName + " is not supported");
				}
			}

			return originContracts;
		}

		return this.contracts;
	}

	/**
	 * Returns the contract object with the provided name
	 * @param name The contract name as defined by the "name" object in the XML
	 */
	getContractByName(name: string) {

		this.loadContracts();

		return this.contracts?.[name];
	}

	/**
	 * Returns the viewContent with the provided name.
	 * Multiple actions can share the same HTML/JS/CSS code to reduce duplication in the XML
	 * @param name The viewContent name as defined by the "name" object in the XML
	 */
	public getViewContent(name: string) {

		const viewContents = this.tokenDef.documentElement.getElementsByTagName("ts:viewContent");

		for (let i in viewContents) {
			if (viewContents[i].getAttribute("name") === name) {
				return viewContents[i].children;
			}
		}

		return null;
	}

	/**
	 * Token metadata for the TokenScript origin contract/s
	 * @param reloadFromAdapter Fetch data from the token discover adapter. i.e. Used to load tokens for a different wallet address
	 * @param bypassCache This is passed to the token discovery adapter, indicating the data should be refreshed from the source rather than being loaded from any cache
	 */
	public async getTokenMetadata(reloadFromAdapter = false, bypassCache = false){

		if (!this.tokenMetadata || reloadFromAdapter){

			this.emitEvent("TOKENS_LOADING");

			const tokenMeta = await this.resolveTokenMetadata(bypassCache);

			this.tokenMetadata = {};

			for (let token of tokenMeta){
				this.tokenMetadata[token.id] = token;
			}

			this.emitEvent("TOKENS_UPDATED", {tokens: this.tokenMetadata})
		}

		return this.tokenMetadata;
	}

	/**
	 * Manually set TokenScript metadata.
	 * This can be used for the user-agent to push token updates rather than calling getTokenMeta with the refresh option
	 * @param tokenMetadata
	 */
	public setTokenMetadata(tokenMetadata: IToken[]){
		const metaMap: TokenMetadataMap = {};

		for (let meta of tokenMetadata){
			metaMap[meta.id] = meta;
		}

		this.tokenMetadata = metaMap;
		this.emitEvent("TOKENS_UPDATED", {tokens: this.tokenMetadata})
	}

	/**
	 * Request token meta updates via the TokenDiscoveryAdapter implementation provided by the user-agent
	 */
	public async resolveTokenMetadata(reload: boolean) {

		const tokenDiscovery = this.tokenDiscoveryAdapter ?? await this.engine.getTokenDiscoveryAdapter();

		const initialTokenData = this.buildTokenDiscoveryData();

		return await tokenDiscovery.getTokens(initialTokenData, reload);
	}

	/**
	 * Prepare initial token meta to be sent to the TokenDiscoveryAdapter
	 * @param originOnly
	 * @private
	 */
	private buildTokenDiscoveryData(originOnly = true){

		const originContracts = this.getContracts(originOnly);

		const initialTokenDetails: IToken[] = [];

		for (let i in originContracts){

			const contract = originContracts[i];

			// TODO: how to handle multiple addresses for each origin? Ask James Brown.
			const addresses = contract.getAddresses();

			for (let key in addresses){

				initialTokenDetails.push({
					id: i, // TODO: ensure that this is unique
					blockChain: "eth",
					tokenType: contract.getInterface(),
					chainId: addresses[key].chain,
					collectionId: addresses[key].address,
				});
			}
		}

		return initialTokenDetails;
	}

	/**
	 * Sets a new TokenDiscoveryAdapter instance
	 * @param adapter
	 */
	public setTokenDiscoveryAdapter(adapter: ITokenDiscoveryAdapter){
		this.tokenDiscoveryAdapter = adapter;
	}

	/**
	 * Set the current token context that's used when showing cards and resolving attributes.
	 * Any attribute using 'tokenId' reference will use this context to resolve attributes by default
	 * @param contractName
	 * @param tokenIndex
	 */
	public setCurrentTokenContext(contractName: string, tokenIndex: number = null){

		if (!this.tokenMetadata[contractName]){
			throw new Error("Cannot set token context: contractName was not found")
		}

		if (tokenIndex == null){
			this.tokenContext = this.tokenMetadata[contractName];
			return;
		}

		if (!this.tokenMetadata[contractName].nftDetails?.[tokenIndex]){
			throw new Error("Cannot set token context: contractName was not found")
		}

		this.tokenContext = this.tokenMetadata[contractName];
		this.tokenContext.selectedNftIndex = tokenIndex;
		this.tokenContext.selectedNftId = this.tokenMetadata[contractName].nftDetails[tokenIndex].tokenId;

		if (this.hasViewBinding()) {
			const currentCard = this.getViewController().getCurrentCard();

			if (currentCard) {
				this.getViewController().updateCardData();
			}
		}
	}

	/**
	 * The current token context
	 * selectedNftId & selectedNftIndex are only populated if the token is non-fungible (ERC-721)
	 */
	public getCurrentTokenContext(){
		return this.tokenContext;
	}

	/**
	 * The top-level (global) attributes for this TokenScript
	 */
	public getAttributes(){

		if (!this.attributes){
			this.attributes = new Attributes(this, this.tokenDef.documentElement);
		}

		return this.attributes;
	}

	/**
	 * Selection filters for the TokenScript
	 * These are used to disable cards/actions based on some conditions - such as disabling an action for a certain range of tokens
	 */
	public getSelections(){

		if (!this.selections){
			this.selections = new Selections(this, this.tokenDef.documentElement);
		}

		return this.selections;
	}

	/**
	 * Returns the ASN module definition by name
	 * ASN module definitions are used to specify the schema that is needed to decode ASN encoded data
	 * Currently it is only used for ethereum event decoding, but it will be used later for attestations (off-chain tokens)
	 * @param name
	 */
	public getAsnModuleDefinition(name){
		const modules = this.tokenDef.getElementsByTagName("asnx:module")[0];
		return modules.querySelector("[name=" + name + "]");
	}

	/**
	 * Execute the TokenScript transaction
	 * @param transaction TokenScript transaction object
	 * @param listener A listener function to receive transaction update events
	 * @param waitForConfirmation Wait for transaction confirmation
	 */
	public async executeTransaction(transaction: Transaction, listener?: ITransactionListener, waitForConfirmation: boolean = true){

		const wallet = await this.engine.getWalletAdapter();
		const transInfo = transaction.getTransactionInfo();

		// TODO: confirm with James exact use cases of having multiple address in a contract element
		const chain = this.getCurrentTokenContext()?.chainId ?? await wallet.getChain();

		const contract = transInfo.contract.getAddressByChain(chain, true);

		const ethParams = [];

		for (let i in transInfo.args){
			ethParams.push({
				name: i.toString(),
				type: transInfo.args[i].type,
				internalType: transInfo.args[i].type,
				value: await transInfo.args[i].getValue(this.getCurrentTokenContext())
			})
		}

		const ethValue = transInfo.value ? await transInfo?.value?.getValue(this.getCurrentTokenContext()) : null;

		try {
			await wallet.sendTransaction(contract.chain, contract.address, transInfo.function, ethParams, [], ethValue, waitForConfirmation, listener);
		} catch (e){

			console.error(e);

			const matches = e.message.match(/reason="([^"]*)"/);

			if (matches?.length > 1)
				throw new Error(matches[1]);

			if (e.message.indexOf("ACTION_REJECTED") > -1)
				throw new Error("Transaction rejected");

			throw e;
		}
	}
}
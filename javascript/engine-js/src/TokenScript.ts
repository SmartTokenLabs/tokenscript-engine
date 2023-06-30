import {ScriptSourceType, TokenScriptEngine} from "./Engine";
import {Card} from "./tokenScript/Card";
import {Contract} from "./tokenScript/Contract";
import {Transaction} from "./tokenScript/Transaction";
import {ITokenCollection} from "./tokens/ITokenCollection";
import {Attributes} from "./tokenScript/Attributes";
import {ViewController} from "./view/ViewController";
import {IViewBinding} from "./view/IViewBinding";
import {SecurityInfo} from "./security/SecurityInfo";
import {Selections} from "./tokenScript/selection/Selections";
import {Label} from "./tokenScript/Label";
import {ITokenDiscoveryAdapter} from "./tokens/ITokenDiscoveryAdapter";
import {AttestationDefinitions} from "./tokenScript/attestation/AttestationDefinitions";
import {Attestation} from "./attestation/Attestation";
import {Origin, OriginType} from "./tokenScript/Origin";
import {ITokenContextData} from "./tokens/ITokenContextData";

export interface ITokenContext extends ITokenCollection {
	originId: string
	selectedTokenIndex?: number // TODO: Deprecate selectedTokenIndex
	selectedTokenId?: string
}

export interface ITokenIdContext {
	originId: string
	chainId: number
	selectedTokenId?: string
}

export interface TokenScriptEvents {
	TOKENS_UPDATED: TokensUpdatedEventArgs
	TOKENS_LOADING: void
}

export interface TokensUpdatedEventArgs {
	tokens: TokenMetadataMap
}

export type EventHandler = (data: any) => Promise<void>|void;

export type TokenMetadataMap = { [contractName: string]: ITokenCollection };

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

	private origins?: { [originName: string]: Origin };

	private contracts?: { [contractName: string]: Contract };

	private tokenMetadata?: TokenMetadataMap;

	private cards?: Card[];

	private attributes?: Attributes;

	private attestationDefinitions?: AttestationDefinitions;

	private selections?: Selections;

	private tokenContext?: ITokenContext;

	private viewController?: ViewController;

	private securityInfo: SecurityInfo;

	private eventHandlers: {[eventName: string]: {[handlerId: string]: EventHandler}} = {};

	private tokenDiscoveryAdapter?: ITokenDiscoveryAdapter;

	constructor(
		private engine: TokenScriptEngine,
		private tokenDef: XMLDocument,
		private xmlStr: string,
		private source: ScriptSourceType,
		private sourceId: string,
		private sourceUrl: string,
		private viewBinding?: IViewBinding
	) {
		this.securityInfo = new SecurityInfo(this, this.tokenDef, this.xmlStr, this.source, this.sourceUrl);
	}

	public getSourceInfo(){
		return {
			tsId: this.sourceId,
			source: this.source
		}
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
			for (const handler of Object.values(this.eventHandlers[eventType])){
				handler(params);
			}
	}

	/**
	 * Register an event listener to receive TokenScript events
	 * @param eventType
	 * @param callback
	 * @param id - The ID of the event handler, used to avoid duplicate handlers & remove handlers
	 */
	public on<
		T extends keyof TokenScriptEvents, // <- T points to a key
		R extends (data: ((TokenScriptEvents)[T])) => Promise<void>|void // <- R points to the type of that key
	>(eventType: T, callback: R, id: string = "default"){

		if (!this.eventHandlers[eventType])
			this.eventHandlers[eventType] = {};

		this.eventHandlers[eventType][id] = callback;
	}

	/**
	 * Remove an event listener
	 * @param eventType
	 * @param id The ID of the handler to remove - if not specified then all handlers are removed.
	 */
	public off<
		T extends keyof TokenScriptEvents, // <- T points to a key
	>(eventType: T, id?: string){

		if (!id) {
			delete this.eventHandlers[eventType];
			return;
		}

		delete this.eventHandlers[eventType][id];
	}

	/**
	 * Returns the XML string for the TokenScript
	 */
	public getXmlString(){
		return this.xmlStr;
	}

	/**
	 * Returns the parsed XML DOM object for the TokenScript
	 */
	public getXml(){
		return this.tokenDef;
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
	public getCards(tokenOrigin?: string): Card[] {

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

		// Only return cards available for the specified token origins
		if (tokenOrigin){
			return this.cards.filter((card) => {
				return card.origins.length === 0 || card.origins.indexOf(tokenOrigin) > -1;
			});
		}

		return this.cards;
	}

	/**
	 * Contracts for the TokenScript
	 * @param originsOnly
	 */
	public getContracts(originsOnly = false) {

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

		if (originsOnly){
			const origins = this.getOrigins();
			const originContracts = {};
			for (const name in this.contracts){
				if (origins[name])
					originContracts[name] = this.contracts[name];
			}
		}

		return this.contracts;
	}

	public getOrigins(){

		if (!this.origins){

			const origins = this.tokenDef.documentElement.getElementsByTagName("ts:origins");

			this.origins = {}

			for (let i in origins[0].children) {

				const origin = origins[0].children[i];

				if (!origin.tagName) continue;

				if (origin.tagName == "ts:ethereum"){

					const contractName = origin.getAttribute("contract");
					this.origins[contractName] = new Origin(this, contractName, "contract");

				} else if (origin.tagName == "ts:attestation") {

					const attestDefName = origin.getAttribute("name");
					this.origins[attestDefName] = new Origin(this, attestDefName, "attestation");

				} else {
					console.warn("Token origin with tag " + origin.tagName + " is not supported");
				}
			}

		}

		return this.origins;
	}

	/**
	 * Returns the contract object with the provided name
	 * @param name The contract name as defined by the "name" object in the XML
	 */
	getContractByName(name: string) {

		const contracts = this.getContracts();

		return contracts?.[name];
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
				this.tokenMetadata[token.originId] = token;
			}

			for (const definition of this.getAttestationDefinitions()){

				const id = definition.name;

				const tokenCollection: ITokenCollection = {
					originId: id,
					blockChain: "offchain",
					chainId: 0,
					tokenType: "eas",
					tokenDetails: [],
					name: definition.meta.name,
					image: definition.meta.image,
					description: definition.meta.description,
					decimals: 0,
					balance: 0
				};

				for (const attestation of await this.engine.getAttestationManager().getAttestations(definition)){
					tokenCollection.balance++;

					const {name, description, image, attributes, ...otherMeta}: any = attestation.meta;

					const data = {
						...attestation,
						meta: otherMeta,
						abiEncoded: Attestation.getAbiEncodedEasAttestation(attestation.decodedToken)
					}

					tokenCollection.tokenDetails.push({
						collectionDetails: tokenCollection,
						collectionId: attestation.collectionId,
						tokenId: attestation.tokenId,
						name,
						description,
						image,
						attributes,
						data
					})
				}

				this.tokenMetadata[tokenCollection.originId] = tokenCollection;
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
	public setTokenMetadata(tokenMetadata: ITokenCollection[]){
		const metaMap: TokenMetadataMap = {};

		for (let meta of tokenMetadata){
			metaMap[meta.originId] = meta;
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
	 * Get initial origin token data for the TokenScript
	 */
	public getTokenOriginData(){
		return this.buildTokenDiscoveryData();
	}

	public async getTokenContextData(tokenIdContext?: ITokenIdContext){

		let tokenContext: ITokenContext;

		if (tokenIdContext){

			// Get token context object from ITokenIdContext
			tokenContext = this.tokenMetadata[tokenIdContext.originId];
			let tokenIndex = null;

			for (const [index, token] of Object.entries(tokenContext.tokenDetails)){
				if (token.tokenId === tokenIdContext.selectedTokenId){
					tokenIndex = index;
					break;
				}
			}

			tokenContext = {
				...this.tokenMetadata[tokenIdContext.originId],
				selectedTokenId: tokenIdContext.selectedTokenId,
				selectedTokenIndex: tokenIndex
			};

		} else {
			tokenContext = this.tokenContext;
		}

		let data: ITokenContextData;

		if (tokenContext){

			const tokenDetails = tokenContext.selectedTokenIndex !== undefined ? tokenContext.tokenDetails[tokenContext.selectedTokenIndex] : null;

			data = {
				name: tokenDetails?.name ?? tokenContext.name,
				description: tokenDetails?.description ?? tokenContext.description,
				label: tokenContext.name,
				symbol: tokenContext.symbol,
				_count: tokenContext.balance,
				contractAddress: tokenContext.contractAddress,
				chainId: tokenContext.chainId,
				tokenId: tokenContext.selectedTokenId,
				ownerAddress: await this.getCurrentOwnerAddress(),
				image_preview_url: tokenDetails?.image ?? tokenContext.image,
			};

			if (tokenDetails) {

				data.tokenInfo = {
					collectionId: tokenDetails.collectionId,
					tokenId: tokenDetails.tokenId,
					type: tokenContext.tokenType,
					name: tokenDetails.name ?? tokenDetails.data.title,
					description: tokenDetails.description,
					image: tokenDetails.image,
					attributes: tokenDetails.attributes ?? [],
					data: tokenDetails.data
				}

				// Extract top level attestation fields for use in transaction inputs.
				if (tokenDetails?.data?.abiEncoded) {
					data.attestation = tokenDetails.data.abiEncoded.attestation;
					data.signature = tokenDetails.data.abiEncoded.signature;
				}
			}

		} else {
			const contracts = this.getContracts(true);

			const primaryAddr = contracts[Object.keys(contracts)[0]].getFirstAddress();

			data = {
				name: this.getName(),
				label: this.getLabel(),
				contractAddress: primaryAddr?.address,
				chainId: primaryAddr?.chain,
				ownerAddress: await this.getCurrentOwnerAddress(),
			};
		}

		return data;
	}

	public async getCurrentOwnerAddress(){
		// TODO: ownerAddress should probably come from token details rather than the current wallet
		const walletProvider = await this.engine.getWalletAdapter();

		return await walletProvider.getCurrentWalletAddress();
	}

	/**
	 * Prepare initial token meta to be sent to the TokenDiscoveryAdapter
	 * @param originOnly
	 * @private
	 */
	private buildTokenDiscoveryData(originOnly = true){

		const originContracts = this.getContracts(originOnly);

		const initialTokenDetails: ITokenCollection[] = [];

		for (let i in originContracts){

			const contract = originContracts[i];

			// TODO: how to handle multiple addresses for each origin? Ask James Brown.
			const addresses = contract.getAddresses();

			for (let key in addresses){

				initialTokenDetails.push({
					originId: i, // TODO: ensure that this is unique
					blockChain: "eth",
					tokenType: contract.getInterface(),
					chainId: addresses[key].chain,
					contractAddress: addresses[key].address,
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

		if (!this.tokenMetadata[contractName].tokenDetails?.[tokenIndex]){
			throw new Error("Cannot set token context: contractName was not found")
		}

		this.tokenContext = this.tokenMetadata[contractName];
		this.tokenContext.originId = contractName;
		this.tokenContext.selectedTokenIndex = tokenIndex;
		this.tokenContext.selectedTokenId = this.tokenMetadata[contractName].tokenDetails[tokenIndex].tokenId;

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
	 * The attestation definitions defined in the TokenScripts
	 */
	public getAttestationDefinitions(){

		if (!this.attestationDefinitions){
			this.attestationDefinitions = new AttestationDefinitions(this, this.tokenDef.documentElement);
		}

		return this.attestationDefinitions;
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
			ethParams.push(await transInfo.args[i].getEthersArgument(this.getCurrentTokenContext(), i.toString()))
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

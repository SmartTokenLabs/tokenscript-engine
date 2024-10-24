import {Attestation} from "./attestation/Attestation";
import {TokenScriptEngine} from "./Engine";
import {ScriptSourceType} from "./IEngine";
import {ITokenCollection} from "./tokens/ITokenCollection";
import {ITokenContextData} from "./tokens/ITokenContextData";
import {ITokenDiscoveryAdapter} from "./tokens/ITokenDiscoveryAdapter";
import {Card} from "./tokenScript/Card";
import {IViewBinding} from "./view/IViewBinding";
import {ViewController} from "./view/ViewController";

import {ScriptInfo} from "./repo/sources/SourceInterface";
import {ITokenContext, ITokenIdContext, ITransactionListener, TokenMetadataMap} from "./ITokenScript";
import {AbstractTokenScript} from "./AbstractTokenScript";
import {ZeroAddress} from "ethers";

/**
 * The TokenScript object represents a single instance of a TokenScript.
 * The TS XML is parsed into various sub-objects on-demand that roughly reflect the structure of the XML.
 * This class contains various top-level methods for getting TokenScript data, showing TokenScript cards &
 * executing transactions
 */
export class TokenScript extends AbstractTokenScript {
	private tokenMetadata?: TokenMetadataMap;

	private viewController?: ViewController;

	private tokenDiscoveryAdapter?: ITokenDiscoveryAdapter;

	constructor(
		engine: TokenScriptEngine,
		tokenDef: XMLDocument,
		xmlStr: string,
		source: ScriptSourceType,
		sourceId: string,
		sourceUrl: string,
		scriptInfo?: ScriptInfo,
		private viewBinding?: IViewBinding
	) {
		super(engine, tokenDef, xmlStr, source, sourceId, sourceUrl, scriptInfo);
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
	 * @param viewBinding - An optional view binding can be supplied to enable the use of multiple views
	 */
	public getViewController(viewBinding?: IViewBinding){

		if (viewBinding)
			return new ViewController(this, viewBinding);

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
	 * @param transactionListener For transaction-only cards, supply a listener to get transaction status
	 * @deprecated In-favor of accessing view controller method directly
	 */
	public async showOrExecuteTokenCard(card: Card, transactionListener?: ITransactionListener){
		await this.getViewController().showOrExecuteCard(card, transactionListener);
	}

	/**
	 * Token metadata for the TokenScript origin contract/s
	 * @param reloadFromAdapter Fetch data from the token discover adapter. i.e. Used to load tokens for a different wallet address
	 * @param bypassCache This is passed to the token discovery adapter, indicating the data should be refreshed from the source rather than being loaded from any cache
	 * @param alwaysFireEvent Always fire the TOKENS_UPDATED event, even when already loaded
	 */
	public async getTokenMetadata(reloadFromAdapter = false, bypassCache = false, alwaysFireEvent = false){

		if (!this.tokenMetadata || reloadFromAdapter){

			this.emitEvent("TOKENS_LOADING");

			const tokenMeta = await this.resolveTokenMetadata(bypassCache);

			this.tokenMetadata = {};

			const tsMeta = this.getMetadata();

			for (let collection of tokenMeta){

				if (this.meta) {

					if (!collection.image && tsMeta.iconUrl && tsMeta.iconUrl.trim())
						collection.image = tsMeta.iconUrl;

					if (!collection.description && tsMeta.description && tsMeta.description.trim())
						collection.description = tsMeta.description;

					if (collection.tokenDetails)
						for (let token of collection.tokenDetails) {
							if (!token.image && tsMeta.iconUrl && tsMeta.iconUrl.trim())
								token.image = tsMeta.iconUrl;

							if (!token.description && tsMeta.description && tsMeta.description.trim())
								token.description = tsMeta.description;
						}
				}

				this.tokenMetadata[collection.originId] = collection;
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
						ownerAddress: attestation.decodedToken.message.recipient,
						name,
						description,
						image,
						attributes,
						data
					})
				}

				this.tokenMetadata[tokenCollection.originId] = tokenCollection;
			}

			this.emitEvent("TOKENS_UPDATED", {tokens: this.tokenMetadata});
		} else if (alwaysFireEvent) {
			this.emitEvent("TOKENS_UPDATED", {tokens: this.tokenMetadata});
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

		if (!initialTokenData.length)
			return [];

		return await tokenDiscovery.getTokens(initialTokenData, reload);
	}

	public async getTokenContextData(tokenIdContext?: ITokenIdContext){

		let tokenContext: ITokenContext;

		if (tokenIdContext){

			// Get token context object from ITokenIdContext
			tokenContext = this.tokenMetadata[tokenIdContext.originId];
			let tokenIndex = undefined;

			if (tokenContext.tokenDetails)
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

			const balance = tokenContext.balance ? tokenContext.balance.toString() : "0"; // bigint can't be json serialized, so it must always be string

			const image = this.getMetadata().imageUrl ?? tokenDetails?.image ?? this.getMetadata().iconUrl;

			data = {
				name: tokenDetails?.name ?? tokenContext.name,
				description: tokenDetails?.description ?? tokenContext.description,
				label: tokenContext.name,
				symbol: tokenContext.symbol,
				_count: balance,
				balance,
				decimals: tokenContext.decimals,
				contractAddress: tokenContext.contractAddress,
				chainId: tokenContext.chainId,
				tokenId: tokenContext.selectedTokenId,
				ownerAddress: tokenContext.tokenType === "erc20" ? await this.getCurrentWalletAddress() : ZeroAddress,
				image_preview_url: image,
			};

			if (tokenDetails) {

				data.tokenInfo = {
					collectionId: tokenDetails.collectionId,
					tokenId: tokenDetails.tokenId,
					type: tokenContext.tokenType,
					name: tokenDetails.name ?? tokenDetails.data?.title,
					description: tokenDetails.description,
					image,
					attributes: tokenDetails.attributes ?? [],
					data: tokenDetails.data
				}

				if (tokenDetails.ownerAddress)
					data.ownerAddress = tokenDetails.ownerAddress;

				// Extract top level attestation fields for use in transaction inputs.
				if (tokenDetails?.data?.abiEncoded) {
					data.attestation = tokenDetails.data.abiEncoded.attestation;
					data.attestationSig = tokenDetails.data.abiEncoded.signature;
				}
			}

		} else {
			const contracts = this.getContracts().getContractsMap(true);

			const primaryAddr = contracts[Object.keys(contracts)[0]].getFirstAddress();

			data = {
				name: this.getName(),
				label: this.getLabel(),
				contractAddress: primaryAddr?.address,
				chainId: primaryAddr?.chain,
				ownerAddress: await this.getCurrentWalletAddress(),
				balance: "0"
			};
		}

		return data;
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
	 * @param tokenId
	 */
	public setCurrentTokenContext(contractName: string, tokenIndex: number|null = null, tokenId: string|null = null){

		if (!this.tokenMetadata[contractName]){
			throw new Error("Cannot set token context: contractName was not found")
		}

		if (tokenIndex == null && tokenId == null){
			this.tokenContext = this.tokenMetadata[contractName];
			return;
		}

		if (tokenIndex != null && !this.tokenMetadata[contractName].tokenDetails?.[tokenIndex]){
			throw new Error("Cannot set token context: token index was not found")
		}

		if (tokenId != null){
			const tokenDetails = this.tokenMetadata[contractName].tokenDetails;
			if (!tokenDetails)
				throw new Error("Cannot set token context: token ID was provided but the origin contract is a fungible token");
			tokenIndex = tokenDetails.findIndex((tokenDetails) => tokenDetails.tokenId === tokenId);
			if (tokenIndex === -1)
				throw new Error(`Cannot set token context: a token with provided ID ${tokenId} was not found`);
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
}

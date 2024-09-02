import {ResolvedScriptData, ScriptInfo, SourceInterface} from "./SourceInterface";
import {TokenScriptEngine, ScriptSourceType} from "../../Engine";

const HOLESKY_DEV_7738 = "0x29a27A5D74Fe8ff01E2dA8b9fC64061A3DFBEe14";
const HOLESKY_ID = 17000; // TODO: Source this from engine
const cacheTimeout = 60 * 1000; // 1 minute cache validity

//cache entries
export interface ScriptEntry {
	scriptURIs: string[];
	timeStamp: number;
}

export interface RegistryMetaData {
	scriptData: ScriptInfo[];
	timeStamp: number;
}

const cachedResults = new Map<string, ScriptEntry>();
const cachedMetaDataResults = new Map<string, RegistryMetaData>();

/**
 * The ScriptURI source implement ethereum EIP-5169
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-5169.md
 */
export class RegistryScriptURI implements SourceInterface {

	// Development deployment of 7738 on Holesky only
	// TODO: Replace with multichain address once available



	constructor(private context: TokenScriptEngine) {
	}

	async resolveAllScripts(tsPath: string){

		const [chain, contractAddr] = tsPath.split("-");

		if (!contractAddr || contractAddr.indexOf("0x") !== 0)
			throw new Error("Not a EIP-5169 or EIP-7738 path");

		let registryScripts: ScriptInfo[] = await this.get7738Metadata(chain, contractAddr);

		if (registryScripts.length == 0)
			throw new Error(`No scripts found in the EIP-7738 registry`);

		if (tsPath.indexOf("17000") === 0)
			console.log("Registry scripts: ", registryScripts);

		return registryScripts;
	}

	// This returns all entries but the 7738 calling function currently selects the first entry
	// TODO: Create selector that displays icon and name for each entry, in order returned
	// TODO: Use global deployed address for 7738
	public async get7738Entry(chain: string, contractAddr: string): Promise<string[]> {

		// use 1 minute persistence fetch cache
		let cachedResult = this.checkCachedResult(chain, contractAddr);

		if (cachedResult.length > 0) {
			return cachedResult;
		}

		const chainId: number = parseInt(chain);

		// TODO: Remove once universal chain deployment is available
		if (chainId != HOLESKY_ID) {
			return [];
		}

		const provider = await this.context.getWalletAdapter();
		let uri: string|string[]|null;

		try {
			uri = Array.from(await provider.call(
				chainId, HOLESKY_DEV_7738, "scriptURI", [
					{
						internalType: "address",
						name: "",
						type: "address",
						value: contractAddr
					}], ["string[]"]
			)) as string[];
		} catch (e) {
			uri = "";
		}

		if (uri && Array.isArray(uri) && uri.length > 0) {
			this.storeResult(chain, contractAddr, uri);
			return uri;
		} else {
			return [];
		}
	}

	public async get7738Metadata(chain: string, contractAddr: string): Promise<ScriptInfo[]> {

		const chainId: number = parseInt(chain);

		// TODO: Remove once universal chain deployment is available
		if (chainId != HOLESKY_ID) {
			return [];
		}

		// use 1 minute persistence fetch cache
		let cachedResult = this.checkCachedMetaData(chain, contractAddr);

		if (cachedResult.length > 0) {
			return cachedResult;
		}

		const provider = await this.context.getWalletAdapter();
		let scriptSourceData: any;

		try {
			scriptSourceData = Array.from(await provider.call(
				chainId, HOLESKY_DEV_7738, "scriptData", [
					{
						internalType: "address",
						name: "contractAddress",
						type: "address",
						value: contractAddr
					}],
				[{
					"components": [
						{
							internalType: "string",
							name: "name",
							type: "string"
						},
						{
							internalType: "string",
							name: "iconURI",
							type: "string"
						},
						{
							internalType: "uint",
							name: "tokenId",
							type: "uint"
						},
						{
							internalType: "string",
							name: "scriptURI",
							type: "string"
						},
						{
							internalType: "bool",
							name: "isAuthenticated",
							type: "bool"
						}
					],
					"internalType": "struct ScriptData[]",
					"name": "",
					"type": "tuple[]"
				}]
			));
		} catch (e) {
			console.error(e);
			scriptSourceData = null;
		}

		let sourceElements: ScriptInfo[] = [];

		//build array
		for (let i = 0; i < scriptSourceData.length; i++) {
			const thisSourceData = scriptSourceData[i];

			sourceElements.push({
				name: thisSourceData.name,
				icon: this.context.processIpfsUrl(thisSourceData.iconURI),
				order: i+1,
				authenticated: thisSourceData.isAuthenticated,
				sourceId: chain + "-" + contractAddr,
				scriptId: typeof thisSourceData.tokenId === 'bigint' ? Number(thisSourceData.tokenId) : thisSourceData.tokenId,
				sourceUrl: thisSourceData.scriptURI,
				type: ScriptSourceType.SCRIPT_REGISTRY
			});
		}

		return sourceElements;
	}

	private storeResult(chain: string, contractAddr: string, uris: string[]) {
		// remove out of date entries
		cachedResults.forEach((value, key) => {
			if (value.timeStamp < (Date.now() - cacheTimeout)) {
				cachedResults.delete(key);
			}
		});

		cachedResults.set(chain + "-" + contractAddr, {
			scriptURIs: uris,
			timeStamp: Date.now()
		});
	}

	private checkCachedResult(chain: string, contractAddress: string): string[] {
		const key = chain + "-" + contractAddress;
		const mapping = cachedResults.get(key);
		if (mapping) {
			if (mapping.timeStamp < (Date.now() - cacheTimeout)) {
				//out of date result, remove key
				cachedResults.delete(key);
				return []
			} else {
				//consoleLog("Can use cache");
				return mapping.scriptURIs;
			}
		} else {
			return [];
		}
	}

	private checkCachedMetaData(chain: string, contractAddress: string): ScriptInfo[] {
		const key = chain + "-" + contractAddress;
		this.removeOutOfDateEntries();
		const mapping = cachedMetaDataResults.get(key);
		if (mapping) {
			return mapping.scriptData;
		} else {
			return [];
		}
	}

	//ensure memory usage is kept to a minimum
	private removeOutOfDateEntries() {
		const currentTime = Date.now();
		for (const [key, value] of cachedMetaDataResults) {
			if (currentTime - value.timeStamp > cacheTimeout) {
				cachedMetaDataResults.delete(key);
			}
		}
	}

	/*public async getAuthenticationStatus(contractAddress: string, order: number) {
		const wallet = await this.engine.getWalletAdapter();
		const chain = this.context.getCurrentTokenContext()?.chainId ?? await wallet.getChain();

		let isAuthorised: boolean = false;

		try {
			isAuthorised = await wallet.call(
				chain, HOLESKY_DEV_7738, "isAuthenticated", [
					{
						internalType: "address",
						name: "",
						type: "address",
						value: contractAddress
					},
					{
						internalType: "uint256",
						name: "",
						type: "uint256",
						value: order
					}], ["bool"]
			);
		} catch (e) {

		}

		return isAuthorised;
	}*/

}

import {ITokenScriptEngine, ScriptSourceType} from "../../IEngine";
import {ScriptInfo, SourceInterface} from "./SourceInterface";

const REGISTRY_7738 = "0x0077380bCDb2717C9640e892B9d5Ee02Bb5e0682";

/**
 * The ScriptURI source implement ethereum EIP-5169
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-5169.md
 */
export class RegistryScriptURI implements SourceInterface {

	constructor(private context: ITokenScriptEngine) {
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

	public async get7738Metadata(chain: string, contractAddr: string): Promise<ScriptInfo[]> {

		const chainId: number = parseInt(chain);

		const provider = await this.context.getWalletAdapter();
		let scriptSourceData: any;

		try {
			scriptSourceData = Array.from(await provider.call(
				chainId, REGISTRY_7738, "scriptData", [
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
			scriptSourceData = [];
		}

		let sourceElements: ScriptInfo[] = [];

		//build array
		for (let i = 0; i < scriptSourceData.length; i++) {
			const thisSourceData = scriptSourceData[i];

			if (thisSourceData.tokenId == 0) {
				continue;
			}

			sourceElements.push({
				name: thisSourceData.name,
				icon: this.context.processIpfsUrl(thisSourceData.iconURI),
				order: i+1,
				authenticated: thisSourceData.isAuthenticated,
				sourceId: chain + "-" + contractAddr,
				scriptId: "7738_" + thisSourceData.tokenId.toString(),
				sourceUrl: thisSourceData.scriptURI,
				type: ScriptSourceType.SCRIPT_REGISTRY
			});
		}

		return sourceElements;
	}

}

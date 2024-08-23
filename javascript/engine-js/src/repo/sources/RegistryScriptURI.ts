import {ResolveResult, SourceInterface} from "./SourceInterface";
import {TokenScriptEngine} from "../../Engine";
import * as fs from 'fs/promises';

const loadFile = async (filePath: string): Promise<string> => {
    return fs.readFile(filePath, 'utf-8');
};

/**
 * The ScriptURI source implement ethereum EIP-5169
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-5169.md
 */
export class RegistryScriptURI implements SourceInterface {

	constructor(private context: TokenScriptEngine) {
	}

	/**
	 * In the case of EIP-5169 and EIP-7738, tsId is a dash separated id that consists of: {$chain}-{$contractAddress}
	 * These two values are used to resolve the ScriptURI for a particular EVM contract and download the TokenScript
	 * from the resolved URL.
	 * @param tsId
	 */
	async getTokenScriptXml(tsId: string): Promise<ResolveResult> {

		const [chain, contractAddr] = tsId.split("-");

		if (!contractAddr || contractAddr.indexOf("0x") !== 0)
			throw new Error("Not a ScriptUri ID");

		let uris: string[] = await this.context.get7738Entry(chain, contractAddr);

		if (uris.length == 0) {
			return {
				xml: "",
				sourceUrl: ""
			};
		}

		//initially pick first, but TODO: give user options
		let uri = this.context.processIpfsUrl(uris[0]);

		if (uri.includes("QmUY21P7eKY2p4NpU65Ma9gWq3UhLC3aYBDNAePEXzwgBe")) {
			return {
				xml: await loadFile('./ts.xml'),
				sourceUrl: uri
			}
		}

		let response = await fetch(uri, {
			cache: "no-store"
		});

		if (response.status < 200 || response.status > 299)
			throw new Error("HTTP Error: " + response.status);

		return {
			xml: await response.text(),
			sourceUrl: uri
		};
	}

}

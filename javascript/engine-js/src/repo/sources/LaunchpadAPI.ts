import {ScriptInfo, SourceInterface} from "./SourceInterface";
import {ITokenScriptEngine} from "../../IEngine";

const LAUNCHPAD_API_URL = "https://store-backend.smartlayer.network/";

export class LaunchpadAPI implements SourceInterface {

	constructor(private context: ITokenScriptEngine) {

	}

	async resolveAllScripts(tsPath: string): Promise<Omit<ScriptInfo, "timestamp">[]> {

		const [chain, contractAddr] = tsPath.split("-");

		if (!contractAddr || contractAddr.indexOf("0x") !== 0)
			throw new Error("Not a EIP-5169 or EIP-7738 path");

		const res = await fetch(`${LAUNCHPAD_API_URL}tokenscript/${contractAddr.toLowerCase()}/chain/${chain}/script-info`);
		return await res.json() as ScriptInfo[];
	}

}

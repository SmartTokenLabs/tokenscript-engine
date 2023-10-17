import {TokenScript} from "../TokenScript";
import {Contract} from "../tokenScript/Contract";

export interface IKeySource {
	type: "contractCall" | "deployer";
	valueType: "ec" | "ethAddress";
	value: string; // Should be a valid hex encoded key or address
}

/**
 * The contract key resolver is used to resolve the owner or deployer of a smart contract
 */
export class ContractKeyResolver {

	/**
	 * Define contract deployment key sources
	 * @private
	 */
	private static KEY_SOURCES: IKeySource[] = [
		{
			type: "contractCall",
			valueType: "ethAddress",
			value: "owner" // The trusted public key of the TokenScript is the smart contract owner (contract must implement 'ownable' interface)
		},
		// TODO: Resolve by finding contract constructor transaction sender
		/*{
			type: "deployer",
			valueType: "ethAddress",
			value: ""
		}*/
	];

	constructor(private tokenScript: TokenScript) {

	}

	/**
	 * Resolve script public key for a contract
	 * @param contract
	 */
	public async resolvePublicKey(contract: Contract){

		const adapter = await this.tokenScript.getEngine().getWalletAdapter();

		// TODO: Implement multiple address checks
		const address = contract.getFirstAddress();

		for (let keySource of ContractKeyResolver.KEY_SOURCES){

			try {

				if (keySource.type === "contractCall"){

					const value = await adapter.call(
						address.chain, address.address, keySource.value, [],
						[(keySource.valueType === "ethAddress" ? "address" : "bytes")]
					);

					return {
						...keySource,
						value
					};
				}

				throw new Error("Key source type " + keySource.type + " is not implemented");

			} catch (e){
				console.error(e);
			}
		}

		throw new Error("Owner or Pubkey for " + address.address + " was not found");
	}
}

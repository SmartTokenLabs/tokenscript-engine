import {TokenScript} from "../TokenScript";

export interface IKeySource {
	type: "contractCall" | "static";
	valueType: "rsa" | "ec" | "ethAddress";
	value: string; // Should be a valid hex encoded key or address
}

/**
 * The public key resolver is used to determine trusted public keys for a specific TokenScript and is used in DSIG validation
 * This is matched against the DSIG signer or the CA when x509 certificates are present in the TokenScript
 */
export class PubkeyResolver {

	/**
	 * Define trusted public key sources
	 * @private
	 */
	private static KEY_SOURCES: IKeySource[] = [
		{
			type: "contractCall",
			valueType: "ethAddress",
			value: "owner" // The trusted public key of the TokenScript is the smart contract owner (contract must implement 'ownable' interface)
		},
		// TODO: Resolve using ERC5XX1 key or static STL root certificate
		/*{
			type: "contractCall",
			valueType: "ethAddress",
			value: "scriptkey"
		},
		{
			type: "static",
			valueType: "rsa",
			value: "0x0"
		}*/
	];

	constructor(private tokenScript: TokenScript) {

	}

	public async resolvePublicKey(){

		const adapter = await this.tokenScript.getEngine().getWalletAdapter();
		const contract = Object.values(this.tokenScript.getContracts(true))[0];
		const address = contract.getFirstAddress();

		for (let keySource of PubkeyResolver.KEY_SOURCES){

			try {

				if (keySource.type === "contractCall"){

					keySource.value = await adapter.call(
						address.chain, address.address, keySource.value, [],
						[(keySource.valueType === "ethAddress" ? "address" : "bytes")]
					);

					return keySource;
				}

				throw new Error("Key source type " + keySource.type + " is not implemented");

			} catch (e){
				console.error(e);
			}
		}

		throw new Error("Owner or Pubkey for " + address.address + " was not found");
	}
}

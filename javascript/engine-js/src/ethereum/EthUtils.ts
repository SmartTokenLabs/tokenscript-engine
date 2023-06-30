import {ethers} from "ethers";


export interface IEthersArgument {
	name: string,
	value: any,
	type: string,
	internalType: string,
	components?: {
		name: string,
		type: string,
		internalType: string
	}[]
}

/**
 * Various static utilities methods for integration with ethers.js
 */
export class EthUtils {

	/**
	 * Encode the parameter as type that can be consumed & encoded by ethers.js library
	 * @param type the tokenscript
	 * @param value
	 */
	public static encodeTransactionParameter(type: string, value: any){

		switch (type){

			case "bool":
				if (typeof value !== "boolean")
					value = Boolean(value);
				return value;

			case "string":
			case "address": // Address is presumed to be properly hex encoded OR is an ENS name
				return value;
		}

		if (EthUtils.isIntType(type)){
			if (typeof value === "string"){
				value = BigInt(value);
			}
			return value;
		}

		if (type.indexOf("byte") === 0){
			if (value && (typeof value !== "string" || value.indexOf("0x") !== 0))
				value = ethers.utils.hexlify(value);
			return value;
		}

		throw new Error("Ethereum argument encoding for type " + type + " is not defined");
	}

	public static getAttestationStructTypes(){

		return {
			"components": [
				{
					"internalType": "bytes32",
					"name": "schema",
					"type": "bytes32"
				},
				{
					"internalType": "address",
					"name": "recipient",
					"type": "address"
				},
				{
					"internalType": "uint64",
					"name": "time",
					"type": "uint64"
				},
				{
					"internalType": "uint64",
					"name": "expirationTime",
					"type": "uint64"
				},
				{
					"internalType": "bool",
					"name": "revocable",
					"type": "bool"
				},
				{
					"internalType": "bytes32",
					"name": "refUID",
					"type": "bytes32"
				},
				{
					"internalType": "bytes",
					"name": "data",
					"type": "bytes"
				}
			],
			"internalType": "struct EasTicketVerify.AttestationCoreData",
			"type": "tuple"
		}
	}

	/**
	 * Returns true if the argument type is int or uint
	 * @param type
	 * @private
	 */
	private static isIntType(type: string){
		const intIndex = type.indexOf("int");
		return intIndex === 0 || intIndex === 1;
	}

	/**
	 * Convert TokenScript output ('as' attribute) to a type accepted by ethers.js
	 * @param outputType
	 */
	public static tokenScriptOutputToEthers(outputType){

		switch (outputType){
			case "utf8":
				return "string";
		}

		return outputType;
	}
}

import { ethers } from "ethers";
import {TokenScript} from "../TokenScript";
import {Contract} from "../tokenScript/Contract";

export interface TrustedKey {
	issuerName: string;
	valueType: "ec" | "ethAddress";
	value: string;
}

const ACCESS_CONTROL_SCRIPTS_ADMIN = "TS_SCRIPT_ADMIN";

/**
 * The contract key resolver is used to resolve the owner or deployer of a smart contract
 */
export class TrustedKeyResolver {

	constructor(private tokenScript: TokenScript) {

	}

	public getTrustedPublicKey(authPubKey: string, signerPubKey: string){

		const trustedKeys = this.tokenScript.getEngine().config.trustedKeys;

		if (!trustedKeys)
			return null;

		const authEthAddress = ethers.utils.computeAddress(authPubKey);
		const signerEthAddress = ethers.utils.computeAddress(signerPubKey);

		for (const trustedKey of trustedKeys){

			if (trustedKey.valueType === "ethAddress"){
				if (
					authEthAddress.toLowerCase() === trustedKey.value.toLowerCase() ||
					signerEthAddress.toLowerCase() === trustedKey.value.toLowerCase()
				)
					return trustedKey
			} else {
				if (
					authPubKey.toLowerCase() === trustedKey.value.toLowerCase() ||
					signerPubKey.toLowerCase() === trustedKey.value.toLowerCase()
				)
					return trustedKey
			}
		}

		return null;
	}

	/**
	 * Test Ownable and AccessControl interfaces
	 * @param contract
	 * @param dSigAddress
	 */
	public async isAdmin(contract: Contract, dSigAddress: string): Promise<boolean> {
		const adapter = await this.tokenScript.getEngine().getWalletAdapter();

		// TODO: Implement multiple address checks
		const address = contract.getFirstAddress();

		try {
			// at first - check Ownable interface
			const value = await adapter.call(
				address.chain, address.address, "owner", [],
				["address"]
			);

			if (value.toLowerCase() === dSigAddress.toLocaleLowerCase()){
				// console.log(`Address "${dSigAddress}" is owner(). return true.`);
				return true;
			}

			// console.log(`Address "${dSigAddress}" is not owner()`);

			let hasRole = await adapter.call(
				address.chain, address.address, "hasRole", [
					{
						internalType: "bytes32",
						name: "0",
						type: "bytes32",
						// 0x00000... its Admin Role for Openzeppelin AccessControl
						value: ethers.constants.HashZero
					},
					{
						internalType: "address",
						name: "1",
						type: "address",
						value: dSigAddress
					}
					],
				["bool"]
			);

			if (hasRole) return true;

			// check if address has specific scripts role
			hasRole = await adapter.call(
				address.chain, address.address, "hasRole", [
					{
						internalType: "bytes32",
						name: "0",
						type: "bytes32",
						value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(ACCESS_CONTROL_SCRIPTS_ADMIN))
					},
					{
						internalType: "address",
						name: "1",
						type: "address",
						value: dSigAddress
					}
					],
				["bool"]
			);

			if (hasRole) return true;

		} catch (e){
			console.error(e);
		}

		return false;
	}
}

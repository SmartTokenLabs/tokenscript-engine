import {TokenScript} from "../TokenScript";
import {Contract} from "../tokenScript/Contract";
import {IOriginSecurityInfo} from "../tokenScript/Origin";
import {SecurityStatus} from "./SecurityInfo";

export interface ITxValidationInfo extends IOriginSecurityInfo {
	chain: number
	toAddress: string
}

export class TransactionValidator {

	constructor(private tokenScript: TokenScript) {

	}

	public async validateContractAddress(chain: number, address: string){

		for (const contract of Object.values(this.tokenScript.getContracts()) as Contract[]){
			if (Object.values(contract.getAddresses()).find((contractAddr) => {
				return contractAddr.chain === chain && contractAddr.address.toLowerCase() === address.toLowerCase()
			})){
				return this.validateContract(chain, address, contract);
			}
		}

		return this.validateContract(chain, address);
	}

	public async validateContract(chain: number, address: string, contract?: Contract, method?: string){

		const secInfo = await this.tokenScript.getSecurityInfo().getContractSecurityInfo(contract ? contract.getName() : null);

		const txSecInfo = {
			chain,
			toAddress: address,
			...secInfo
		};

		console.log("Verifying contract security info: ", txSecInfo);

		if (txSecInfo.status == SecurityStatus.VALID)
			return true;

		return this.validationCallback({
			chain,
			toAddress: address,
			...txSecInfo
		});
	}

	private async validationCallback(txInfo: ITxValidationInfo): Promise<boolean> {

		const validationCallback = this.tokenScript.getEngine().config.txValidationCallback;

		if (!validationCallback)
			return true;

		return validationCallback(txInfo);
	}
}

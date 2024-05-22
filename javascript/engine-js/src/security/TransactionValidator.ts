import {TokenScript} from "../TokenScript";
import {Contract} from "../tokenScript/Contract";
import {IOriginSecurityInfo} from "../tokenScript/Origin";

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

		return this.validationCallback({
			chain,
			toAddress: address,
			...secInfo
		})
	}

	private async validationCallback(txInfo: ITxValidationInfo): Promise<boolean> {
		// TODO: fire callback defined in TS engine config
		return Promise.resolve(true);
	}
}

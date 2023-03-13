/**
 * Contract represents ts:contract tags that are included in the root tag of a TS (ts:token)
 */
export class Contract {

	private name?;
	private interface?;
	private addresses: {[key: string]: IContractAddress} = {};

	constructor(
		private contractDef: Element
	) {

		this.name = contractDef.getAttribute("name");
		this.interface = contractDef.getAttribute("interface");

		let addressesXml = contractDef.getElementsByTagName("ts:address");

		for (let i in addressesXml) {

			if (!addressesXml.hasOwnProperty(i))
				continue;

			const chain = parseInt(addressesXml[i].getAttribute("network"));

			this.addresses[chain] = <IContractAddress>{
				address: addressesXml[i].innerHTML,
				chain: chain
			};
		}
	}

	/**
	 * Name of the contract as defined by the 'name' attribute of the 'ts:contract' tag
	 */
	public getName(){
		return this.name;
	}

	/**
	 * Interface of the contract as defined by the 'interface' attribute of the 'ts:contract' tag
	 */
	public getInterface(){
		return this.interface;
	}

	/**
	 * An object of addresses, keyed by chain
	 */
	public getAddresses(){
		return this.addresses;
	}

	/**
	 * The first address defined in the contract element
	 */
	public getFirstAddress(){

		const keys = Object.keys(this.addresses);

		if (keys.length === 0)
			throw new Error("Contract does not have any addresses");

		return this.addresses[keys[0]];
	}

	/**
	 * Returns the ethereum address related to the provided chain ID
	 * @param chain
	 * @param returnDefault If true, return the default (first) address for any chain rather than throwing an exception
	 */
	public getAddressByChain(chain: number, returnDefault = false){

		if (!this.addresses[chain]) {
			if (returnDefault){
				if (Object.keys(this.addresses).length === 0)
					throw new Error("Contract does not have any addresses");

				return this.getFirstAddress();
			}

			throw new Error("Contract does not have an address with chain ID " + chain);
		}

		return this.addresses[chain];
	}
}

/**
 * Represent ts:address - child element of ts:contract
 */
export interface IContractAddress {
	address: string;
	chain: number;
}

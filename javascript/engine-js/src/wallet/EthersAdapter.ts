import {IWalletAdapter} from "./IWalletAdapter";
import {Contract, ContractTransaction, ethers} from "ethers";
import {ITransactionListener} from "../TokenScript";

export interface IChainConfig {
	rpc: string,
	explorer: string
}

/**
 * The in-build implementation of IWalletAdapter that uses ethers.js to connect a wide range of wallet providers
 */
export class EthersAdapter implements IWalletAdapter {

	private ethersProvider: ethers.providers.Web3Provider

	constructor(public getWalletEthersProvider: () => Promise<ethers.providers.Web3Provider>, private chainConfig: {[key: number]: IChainConfig}) {

	}

	private async getEthersProvider(){

		this.ethersProvider = await this.getWalletEthersProvider();

		return this.ethersProvider;
	}

	async signPersonalMessage(data){
		const ethersProvider = await this.getEthersProvider();

		return await ethersProvider.getSigner().signMessage(data);
	}

	async call(chain: number, contractAddr: string, method: string, args: any[], outputTypes: string[]){

		console.log("Call ethereum method. chain " + chain + "; contract " + contractAddr + "; method " + method + ";");
		//console.log(args);

		const contract = await this.getEthersContractInstance(chain, contractAddr, method, args, outputTypes, "view");

		return await contract[method](...(args.map((arg: any) => arg.value))) as ContractTransaction;
	}

	async sendTransaction(chain: number, contractAddr: string, method: string, args: any[], outputTypes: string[], value?: BigInt, waitForConfirmation: boolean = true, listener?: ITransactionListener){

		console.log("Send ethereum transaction. chain " + chain + "; contract " + contractAddr + "; method " + method + "; value " + value);
		console.log(args);

		await this.switchChain(chain);

		// TODO: if no method is set, send raw transaction? Is this allowed?
		// TODO: handle no-method transaction

		const contract = await this.getEthersContractInstance(chain, contractAddr, method, args, outputTypes, value ? "payable" : "nonpayable");

		const overrides: any = {};

		if (value)
			overrides.value = value;

		const tx = await contract[method](...(args.map((arg: any) => arg.value)), overrides) as ContractTransaction;

		console.log("Transaction submitted: " + tx.hash);

		listener({
			status: 'submitted',
			txNumber: tx.hash
		});

		if (waitForConfirmation)
			await tx.wait().then((transactionReceipt) => {

				if (transactionReceipt.status !== 1) {
					console.error(transactionReceipt);
					throw new Error("Transaction failed: " + transactionReceipt.status);
				}

				console.log("Transaction completed!");

				listener({
					status: 'confirmed',
					txNumber: tx.hash,
					txLink: this.chainConfig[chain].explorer ? this.chainConfig[chain].explorer + tx.hash : null
				});

				return transactionReceipt;
			});

		return tx;
	}

	private async getEthersContractInstance(chain: number, contractAddr: string, method: string, args: any[], outputTypes: string[], stateMutability: string){

		const abiData = {
			name: method,
			inputs: args,
			outputs: outputTypes.map((value, index) => {

				// Converted value
				const convertedType = value === "uint" ? "uint256" : value;

				return {
					name: index.toString(),
					type: convertedType,
					internalType: convertedType
				}
			}),
			stateMutability: stateMutability,
			type: "function"
		};

		console.log(abiData);

		// TODO: add all chain URLs into some configuration.
		const provider = stateMutability === "view" ?
							new ethers.providers.JsonRpcProvider(this.getRpcUrl(chain), chain) :
							(await this.getEthersProvider()).getSigner();

		return new Contract(contractAddr, [abiData], provider);
	}

	private getRpcUrl(chainId: number){

		if (!this.chainConfig[chainId])
			throw new Error("RPC URL is not configured for ethereum chain: " + chainId);

		return this.chainConfig[chainId].rpc;
	}

	async getChain(){

		if (!this.ethersProvider)
			return 1;

		const ethersProvider = await this.getEthersProvider();

		const network = await ethersProvider.getNetwork();

		return network.chainId;
	}

	private async switchChain(chain: number){

		const ethersProvider = await this.getEthersProvider();

		if (chain != await this.getChain()){

			console.log("Switch chain: ", chain);

			try {
				await ethersProvider.send("wallet_switchEthereumChain", [{chainId: "0x" + chain.toString(16)}]);
			} catch (e){
				console.error(e);
				throw new Error("Connected to wrong chain, please switch the chain to chainId: " + chain + ", error: " + e.message);
			}
		}
	}

	async getCurrentWalletAddress() {

		const ethersProvider = await this.getEthersProvider();

		const accounts = await ethersProvider.listAccounts();

		if (!accounts?.length){
			throw new Error("Wallet could not connect or there is no accounts created");
		}

		return accounts[0];
	}

	async getEvents(chain: number, contractAddr: string, event: string, inputs: any[]) {

		console.log("Get ethereum events. chain " + chain + "; contract " + contractAddr + "; event " + event + ";");
		console.log(inputs);

		const provider = new ethers.providers.JsonRpcProvider(this.getRpcUrl(chain));

		const contract = new Contract(contractAddr, [{
			name: event,
			type: "event",
			inputs: inputs
		}], provider);

		const values = inputs.map((input) => input.value);

		return await contract.queryFilter(contract.filters[event](...values));
	}
}
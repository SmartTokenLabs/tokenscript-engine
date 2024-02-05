import {IWalletAdapter, RpcRequest} from "./IWalletAdapter";
import {Contract, ContractTransaction, ethers} from "ethers";
import {ITransactionListener} from "../TokenScript";
import {decodeError} from "ethers-decode-error";

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

	async call(chain: number, contractAddr: string, method: string, args: any[], outputTypes: string[]|any[], errorAbi: any[] = []){

		console.log("Call ethereum method. chain " + chain + "; contract " + contractAddr + "; method " + method + ";");
		//console.log(args);

		const contract = await this.getEthersContractInstance(chain, contractAddr, method, args, outputTypes, "view", errorAbi);

		// Function properties without arguments may collide with in-built Javascript functions (i.e. Object.valueOf), so we should always include arguments
		method = `${method}(${args.map((arg) => arg.type).join(",")})`;

		return await contract[method](...(args.map((arg: any) => arg.value))) as ContractTransaction;
	}

	async sendTransaction(chain: number, contractAddr: string, method: string, args: any[], outputTypes: string[], value?: BigInt, waitForConfirmation: boolean = true, listener?: ITransactionListener, errorAbi: any[] = []){

		console.log("Send ethereum transaction. chain " + chain + "; contract " + contractAddr + "; method " + method + "; value " + value + "; args", args);

		await this.switchChain(chain);

		// TODO: if no method is set, send raw transaction? Is this allowed?
		// TODO: handle no-method transaction

		const contract = await this.getEthersContractInstance(chain, contractAddr, method, args, outputTypes, value ? "payable" : "nonpayable", errorAbi);

		const overrides: any = {};

		if (value)
			overrides.value = value;

		let tx;

		try {
			tx = await contract[method](...(args.map((arg: any) => arg.value)), overrides) as ContractTransaction;
		} catch (e: any){
			const decodedError = decodeError(e, errorAbi);
			console.error(e);
			console.log("Decoded error: ", decodedError);
			if (decodedError.type > 0) {
				const decodedMessage = decodedError.type === 4 && typeof e === "string" ? e :
					("Contract execution failed: " + (typeof decodedError.error === "object" ? JSON.stringify(decodedError.error) : decodedError.error));
				if (typeof e === "string"){
					e = new Error(decodedMessage);
				} else {
					e.message = decodedMessage;
				}
			}
			throw e;
		}

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

	private async getEthersContractInstance(chain: number, contractAddr: string, method: string, args: any[], outputTypes: string[]|any[], stateMutability: string, errorAbi: any[] = []){

		const abiData = {
			name: method,
			inputs: args,
			outputs: typeof outputTypes[0] === "string" ? outputTypes.map((value, index) => {

				// Converted value
				const convertedType = value === "uint" ? "uint256" : value;

				return {
					name: value.name ?? index.toString(),
					type: convertedType,
					internalType: convertedType
				}
			}) : outputTypes,
			stateMutability: stateMutability,
			type: "function"
		};

		console.log(abiData);

		// TODO: add all chain URLs into some configuration.
		const provider = stateMutability === "view" ?
							new ethers.providers.StaticJsonRpcProvider(this.getRpcUrl(chain), chain) :
							(await this.getEthersProvider()).getSigner();

		return new Contract(contractAddr, [abiData, ...errorAbi], provider);
	}

	public getRpcUrl(chainId: number){

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

		const provider = new ethers.providers.StaticJsonRpcProvider(this.getRpcUrl(chain), chain);

		const contract = new Contract(contractAddr, [{
			name: event,
			type: "event",
			inputs: inputs
		}], provider);

		const values = inputs.map((input) => input.value);

		return await contract.queryFilter(contract.filters[event](...values));
	}

	// TODO: Handle chain switching
	async rpcProxy(request: RpcRequest): Promise<any> {
		return (await this.getEthersProvider()).provider.request(request);
	}
}

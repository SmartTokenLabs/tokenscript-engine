import {IWalletAdapter, RpcRequest} from "./IWalletAdapter";
import {Contract, ContractRunner, ContractTransaction, ethers, EventLog, Network} from "ethers";
import {ITransactionListener} from "../TokenScript";
import {ErrorDecoder, ErrorType} from "ethers-decode-error";

export interface IChainConfig {
	rpc: string,
	explorer: string
}

/**
 * The in-build implementation of IWalletAdapter that uses ethers.js to connect a wide range of wallet providers
 */
export class EthersAdapter implements IWalletAdapter {

	private ethersProvider: ethers.BrowserProvider

	constructor(public getWalletEthersProvider: () => Promise<ethers.BrowserProvider>, private chainConfig: {[key: number]: IChainConfig}) {

	}

	private async getEthersProvider(){

		this.ethersProvider = await this.getWalletEthersProvider();

		return this.ethersProvider;
	}

	async signPersonalMessage(data){
		const ethersProvider = await this.getEthersProvider();

		return (await ethersProvider.getSigner()).signMessage(data);
	}

	async call(chain: number, contractAddr: string, method: string, args: any[], outputTypes: string[]|any[], errorAbi: any[] = []){

		console.log("Call ethereum method. chain " + chain + "; contract " + contractAddr + "; method " + method + ";");
		//console.log(args);

		const contract = await this.getEthersContractInstance(chain, contractAddr, method, args, outputTypes, "view", errorAbi);

		// Getting a function only by name could be ambiguous, so we use the full signature
		method = `${method}(${args.map((arg) => arg.type).join(",")})`;

		return (await contract.getFunction(method).staticCall(...(args.map((arg: any) => arg.value))));
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

		// Getting a function only by name could be ambiguous, so we use the full signature
		method = `${method}(${args.map((arg) => arg.type).join(",")})`;

		try {
			tx = await contract[method](...(args.map((arg: any) => arg.value)), overrides) as ContractTransaction;
		} catch (e: any){
			const errDecoder = ErrorDecoder.create(errorAbi)
			const decodedError = await errDecoder.decode(e);
			console.error(e);
			console.log("Decoded error: ", decodedError);
			if (decodedError.type != ErrorType.EmptyError && decodedError.type != ErrorType.UnknownError) {
				const decodedMessage = decodedError.type === ErrorType.UserRejectError && typeof e === "string" ? e :
					("Contract execution failed: " + (typeof decodedError.reason === "object" ? JSON.stringify(decodedError.reason) : decodedError.reason));
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
					name: value.name ?? "",
					type: convertedType,
					internalType: convertedType
				}
			}) : outputTypes,
			stateMutability: stateMutability,
			type: "function"
		};

		console.log(abiData);

		// @ts-ignore
		const useBrowserProvider = stateMutability !== "view" || (window.ethereum.isMetaMask && (await this.getChain()) === chain);

		if (stateMutability === "view" && useBrowserProvider)
			console.log("Using wallet RPC for view call!");

		const provider = useBrowserProvider ?
							await (await this.getEthersProvider()).getSigner() as ContractRunner :
							new ethers.JsonRpcProvider(this.getRpcUrl(chain), chain, { staticNetwork: new Network(chain.toString(), chain) });

		return new Contract(contractAddr, [abiData, ...errorAbi], provider);
	}

	public getRpcUrl(chainId: number){

		if (!this.chainConfig[chainId])
			throw new Error("RPC URL is not configured for ethereum chain: " + chainId);

		return this.chainConfig[chainId].rpc;
	}

	async getChain(){

		//if (!this.ethersProvider)
			//return 1;

		const ethersProvider = await this.getEthersProvider();

		const network = await ethersProvider.getNetwork();

		return Number(network.chainId);
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

		return accounts[0].address;
	}

	async getEvents(chain: number, contractAddr: string, event: string, inputs: any[]): Promise<Array<EventLog>> {

		console.log("Get ethereum events. chain " + chain + "; contract " + contractAddr + "; event " + event + ";");
		console.log(inputs);

		const provider = new ethers.JsonRpcProvider(this.getRpcUrl(chain), chain, { staticNetwork: new Network(chain.toString(), chain) });

		const contract = new Contract(contractAddr, [{
			name: event,
			type: "event",
			inputs: inputs
		}], provider);

		const values = inputs.map((input) => input.value);

		return await contract.queryFilter(contract.filters[event](...values)) as Array<EventLog>;
	}

	// TODO: Handle chain switching
	async rpcProxy(request: RpcRequest): Promise<any> {
		return (await this.getEthersProvider()).send(request.method, request.data);
	}
}

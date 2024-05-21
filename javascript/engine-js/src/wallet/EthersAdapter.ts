import {IWalletAdapter, RpcRequest} from "./IWalletAdapter";
import {
	Contract,
	ContractRunner,
	ContractTransaction,
	ethers,
	EventLog,
	FetchRequest, Fragment,
	NamedFragment,
	Network
} from "ethers";
import {ITransactionListener} from "../TokenScript";
import {ErrorDecoder, ErrorType} from "ethers-decode-error";
import {IPaymasterInfo} from "../tokenScript/Transaction";

export interface IChainConfig {
	rpc: string|string[],
	explorer: string
}

/**
 * The in-build implementation of IWalletAdapter that uses ethers.js to connect a wide range of wallet providers
 */
export class EthersAdapter implements IWalletAdapter {

	private ethersProvider: ethers.BrowserProvider

	constructor(
		public getWalletEthersProvider: () => Promise<ethers.BrowserProvider>,
		public readonly chainConfig: {[key: number]: IChainConfig}
	) {

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

	async sendTransaction(chain: number, contractAddr: string, method: string, args: Fragment[], value?: BigInt, waitForConfirmation: boolean = true, listener?: ITransactionListener, errorAbi: any[] = [], paymaster?: IPaymasterInfo){

		console.log("Send ethereum transaction. chain " + chain + "; contract " + contractAddr + "; method " + method + "; value " + value + "; args", args);

		if (paymaster){

			const fallback = await this.sendUsingPaymaster(chain, contractAddr, method, args, listener, errorAbi, paymaster);

			if (fallback !== true)
				return;

			console.warn("Paymaster API server not available, falling back to direct send.")
		}

		await this.switchChain(chain);

		const contract = await this.getEthersContractInstance(chain, contractAddr, method, args, [], value ? "payable" : "nonpayable", errorAbi);

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

				let decodedMessage;

				if (decodedError.type === ErrorType.UserRejectError && typeof e === "string"){
					decodedMessage = e;
				} else {
					decodedMessage = "Contract execution failed: ";
					if (decodedError.reason === "could not coalesce error" && e.message){
						decodedMessage += e.message;
					} else {
						decodedMessage += (typeof decodedError.reason === "object" ? JSON.stringify(decodedError.reason) : decodedError.reason);
					}
				}

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

	private async sendUsingPaymaster(chain: number, contract: string, method: string, args: any[], listener?: ITransactionListener, errorAbi: any[] = [], paymaster?: IPaymasterInfo){

		let available = false;

		try {
			available = (await this.paymasterApiRequest(paymaster.url + `/status/${chain}/${contract}/${method}`, "get")).enabled;
		} catch (e){
			console.warn("Paymaster API error " + e.message);
		}

		if (available !== true)
			return true;

		const abiInput = args.map((arg: any) => { const nArg = {...arg}; delete nArg.value; return nArg; });

		const argsType = args.map((arg: any) => arg.type);
		const argsData = args.map((arg: any) => arg.value);

		// Remove signature argument from end
		argsType.pop();
		argsData.pop();

		// Encode data without the signature argument but method ID MUST be calculated with the signature argument
		const callData = ethers.id(`${method}(${args.map((arg: any) => arg.type).join(",")})`).substring(0, 10) +
								ethers.AbiCoder.defaultAbiCoder().encode(argsType, argsData).substring(2);
		// Get user signature
		const sig = await this.addPaymasterSignature(contract, callData);

		// Add signature to args
		argsData.push(ethers.AbiCoder.defaultAbiCoder().encode(['bytes', 'uint256'], [sig.signature, sig.expiry]));

		console.log(argsData);

		// Send the request to the server
		let data;
		try {
			data = await this.paymasterApiRequest(paymaster.url + "/tx/send", "post", {
				chain,
				contract,
				method,
				args: argsData.map((arg) => {
					if (typeof arg === "bigint")
						arg = arg.toString()
					return arg;
				}),
				abiInput,
				signature: sig.signature,
				sigMsg: sig.msg
			});
		} catch (e: any){
			// Fallback to direct send for certain status codes
			if ([403].indexOf(e.staus) > -1)
				return true;

			throw e;
		}

		console.log("TX Submitted", data);

		let submitted = false;

		while (true){
			try {
				data = await this.paymasterApiRequest(paymaster.url + `/tx/${data.id}/status`, "get");
			} catch (e: any){
				throw new Error("Paymaster API error: " + e.message);
			}

			if (data.status > 0){
				if (data.status === 1){
					if (!submitted) {
						submitted = true;
						listener({
							status: 'submitted',
							txNumber: data.txHash
						});
					}
				} else if (data.status === 2){
					listener({
						status: 'confirmed',
						txNumber: data.txHash,
						txLink: this.chainConfig[chain].explorer ? this.chainConfig[chain].explorer + data.txHash : null
					});
					break;
				} else {
					console.error(data.error);
					throw new Error(data.error.shortMessage ?? data.error.message);
				}
			}

			await new Promise((resolve) => setTimeout(resolve, 5000));
		}
	}

	private async paymasterApiRequest(url: string, method: "get"|"post", requestData?: any){

		const headers: any = {
			"Content-type": "application/json",
			"Accept": "application/json",
		};

		const res = await fetch(url, {
			method,
			headers,
			body: requestData ? JSON.stringify(requestData): undefined
		});

		let data: any;

		try {
			data = await res.json();
		} catch (e: any){

		}

		if (res.status > 299 || res.status < 200){
			if (res.status === 400 && data.data){
				throw new Error(data.data.shortMessage);
			}
			throw new Error("HTTP Request failed:" + (data?.message ?? res.statusText ));
		}

		return data;
	}

	private async addPaymasterSignature(contractAddr: string, callData: string){

		const expiry = Math.round(Date.now() / 1000) + 3600;

		const msg = `Interact with SmartDragon, contract ${contractAddr.toLowerCase()}, call ${ethers.keccak256(callData)}, expiring ${expiry}`;

		const signature = await this.signPersonalMessage(msg);

		return {msg, signature, expiry};
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
		const useBrowserProvider = stateMutability !== "view" /*|| (window.ethereum.isMetaMask && (await this.getChain()) === chain);*/

		//if (stateMutability === "view" && useBrowserProvider)
			//console.log("Using wallet RPC for view call!");

		const provider = useBrowserProvider ?
							await (await this.getEthersProvider()).getSigner() as ContractRunner :
							this.getRpcProvider(chain);

		return new Contract(contractAddr, [abiData, ...errorAbi], provider);
	}

	public getRpcUrls(chainId: number){

		if (!this.chainConfig[chainId])
			throw new Error("RPC URL is not configured for ethereum chain: " + chainId);

		const rpc = this.chainConfig[chainId].rpc;

		return typeof rpc === "string" ? [rpc]: rpc;
	}

	async getChain(){

		//if (!this.ethersProvider)
			//return 1;

		const ethersProvider = await this.getEthersProvider();

		// We must use _detectNetwork instead of getNetwork since the latter does not detect change from wallet
		const network = await ethersProvider._detectNetwork();

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

		const provider= this.getRpcProvider(chain);

		const contract = new Contract(contractAddr, [{
			name: event,
			type: "event",
			inputs: inputs
		}], provider);

		const values = inputs.map((input) => input.value);

		return await contract.queryFilter(contract.filters[event](...values)) as Array<EventLog>;
	}

	private getRpcProvider(chain: number){

		const rpcUrls = this.getRpcUrls(chain);

		if (rpcUrls.length > 1){
			const providers = [];
			for (const url of rpcUrls){
				providers.push(new ethers.JsonRpcProvider(url, chain, { staticNetwork: new Network(chain.toString(), chain) }));
			}
			return new ethers.FallbackProvider(providers, chain, {

			});
		} else {
			return new ethers.JsonRpcProvider(rpcUrls[0], chain, { staticNetwork: new Network(chain.toString(), chain) });
		}
	}

	// TODO: Handle chain switching
	async rpcProxy(request: RpcRequest): Promise<any> {
		return (await this.getEthersProvider()).send(request.method, request.params);
	}
}

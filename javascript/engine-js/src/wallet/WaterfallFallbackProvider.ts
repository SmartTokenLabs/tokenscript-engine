import {AbstractProvider, getBigInt, Network, PerformActionRequest} from "ethers";

export class WaterfallFallbackProvider extends AbstractProvider {

	constructor(private providers: Array<AbstractProvider>) {
		super();
	}

	async _detectNetwork(): Promise<Network> {
		return Network.from(getBigInt(await this._perform({ method: "chainId" })));
	}

	async _perform<T = any>(req: PerformActionRequest): Promise<T> {

		let errors = []

		for (const provider of this.providers){
			try {
				return await provider._perform(req);
			} catch (e) {
				// For non connection errors we can throw
				if (e?.code === "CALL_EXCEPTION"){
					throw e;
				}
				errors.push(e)
				console.error("Provider error, falling back to next provider ", e)
			}
		}

		throw errors[0];
	}

	async destroy(): Promise<void> {
		for (const provider of this.providers) {
			provider.destroy();
		}
		super.destroy();
	}
}

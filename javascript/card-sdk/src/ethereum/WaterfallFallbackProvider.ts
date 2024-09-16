import {AbstractProvider, getBigInt, Network, PerformActionRequest} from "ethers";

export class WaterfallFallbackProvider extends AbstractProvider {

	constructor(private providers: Array<AbstractProvider>) {
		super();
	}

	async _detectNetwork(): Promise<Network> {
		return Network.from(getBigInt(await this._perform({ method: "chainId" })));
	}

	async _perform<T = any>(req: PerformActionRequest): Promise<T> {

		for (const provider of this.providers){
			try {
				return await provider._perform(req);
			} catch (e) {
				console.error("Provider error, falling back to next provider ", e);
			}
		}
	}

	async destroy(): Promise<void> {
		for (const provider of this.providers) {
			provider.destroy();
		}
		super.destroy();
	}
}

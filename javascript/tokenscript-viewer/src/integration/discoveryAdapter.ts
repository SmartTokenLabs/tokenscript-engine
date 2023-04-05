import {ITokenDiscoveryAdapter} from "../../../engine-js/src/tokens/ITokenDiscoveryAdapter";
import {IToken} from "../../../engine-js/src/tokens/IToken";
import {INFTTokenDetail} from "../../../engine-js/src/tokens/INFTTokenDetail";
import {CHAIN_MAP} from "./constants";
import type {Client} from "@tokenscript/token-negotiator";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";

export class TokenNegotiatorDiscovery implements ITokenDiscoveryAdapter {

	updateFromEngine = false;

	constructor(private negotiator: Client, private tokenScript: TokenScript) {

	}

	async getTokens(initialTokenDetails: IToken[]): Promise<IToken[]> {

		this.updateFromEngine = true;

		return new Promise((resolve, reject) => {

			const idMap: {[id: string]: IToken} = {};
			const result: IToken[] = [];

			const issuers = [];

			for (let token of initialTokenDetails){

				// TODO: Remove once negotiator/discovery API has erc20 support
				/*if (token.tokenType === "erc20"){
					token.name = token.id;
					result.push(token);
					continue;
				}*/

				const ref = (token.blockChain + "-" + token.chainId + "-" + token.collectionId).toLowerCase();

				if (!CHAIN_MAP[token.chainId]){
					console.warn("Token discovery not supported for chain ID " + token.chainId);
					continue;
				}

				idMap[ref] = token;

				issuers.push({
					onChain: true,
					collectionID: ref,
					contract: token.collectionId,
					chain: CHAIN_MAP[token.chainId],
					fungible: token.tokenType === "erc20"
				});
			}

			// TODO: Remove once negotiator/discovery API has erc20 support
			/*if (!issuers.length) {
				resolve(result);
				return;
			}*/

			this.negotiator.on('tokens-selected', (tokens) => {

				console.log("Tokens discovered: ");
				console.log(tokens.selectedTokens);

				for (let refId in tokens.selectedTokens){

					if (!idMap[refId])
						continue;

					const tokenData = idMap[refId];

					const tokensMeta = tokens.selectedTokens[refId].tokens;

					if (!tokensMeta.length)
						continue;

					const nftTokenDetails: INFTTokenDetail[] = [];

					if (tokenData.tokenType !== "erc20") {

						for (let tokenMeta of tokensMeta) {

							nftTokenDetails.push({
								collectionDetails: tokenData,
								tokenId: tokenMeta.tokenId,
								name: tokenMeta.title,
								description: tokenMeta.description,
								image: tokenMeta.image,
								data: tokenMeta
							});
						}

						tokenData.nftDetails = nftTokenDetails;
						tokenData.balance = nftTokenDetails.length;

					} else if (tokensMeta.length > 0) {
						tokenData.name = tokensMeta[0].title;
						tokenData.balance = tokensMeta[0].data?.balance;
						tokenData.decimals = tokensMeta[0].data?.decimals;
					} else {
						continue;
					}

					const collectionData = this.negotiator.getTokenStore().getCurrentIssuers(true)[refId];

					tokenData.image = collectionData.image;
					tokenData.symbol = tokensMeta[0]?.symbol ? tokensMeta[0]?.symbol : tokensMeta[0]?.data?.symbol;

					result.push(tokenData);
				}

				// This is hacky but allows us to respond to token updates and wallet change events from negotiator
				if (this.updateFromEngine){
					this.updateFromEngine = false;
					resolve(result);
				} else {
					this.tokenScript.setTokenMetadata(result);
				}

			});

			this.negotiator.negotiate(issuers);
		});
	}
}

import {Component, Element, h, Method, State} from '@stencil/core';
import {TokenScriptEngine} from "../../../../engine-js/src/Engine";

import {Client} from "@tokenscript/token-negotiator";
import "@tokenscript/token-negotiator/dist/theme/style.css";

import {EthersAdapter} from "../../../../engine-js/src/wallet/EthersAdapter";
import {TokenScript} from "../../../../engine-js/src/TokenScript";
import {CHAIN_CONFIG} from "../../integration/constants";
import {IWalletAdapter} from "../../../../engine-js/src/wallet/IWalletAdapter";

export type TokenScriptSource = "resolve" | "file" | "url";

@Component({
	tag: 'app-root',
	styleUrl: 'app.css',
	shadow: false,
})
export class AppRoot {

	async getWalletAdapter(): Promise<IWalletAdapter> {

		return new EthersAdapter(async () => {

			// TODO: replace with modal wallet selector
			var negotiator: Client = new Client({
				'type': 'active',
				'issuers': [],
				'uiOptions': {
					'containerElement': '#tn-main',
					'openingHeading': 'Connect your wallet to load this TokenScripts tokens.'
				}
			});

			const walletProvider = await negotiator.getWalletProvider();

			await walletProvider.loadConnections();

			if (walletProvider.getConnectedWalletData().length === 0) {
				return new Promise((resolve, reject) => {

					negotiator.createUiInstance();
					negotiator.getUi().initialize();
					negotiator.getUi().updateUI("wallet", {
						connectCallback: () => {
							// @ts-ignore
							resolve(walletProvider.getConnectedWalletData()[0].provider);
						}
					})
				});
			}

			return walletProvider.getConnectedWalletData()[0].provider;
		}, CHAIN_CONFIG);
	}

	tsEngine = new TokenScriptEngine(this.getWalletAdapter, null, {
		ipfsGateway: "https://smart-token-labs-demo-server.mypinata.cloud/ipfs/",
	});

	@Element() host: HTMLElement;

	@State() viewerType?: "tabbed"|"integration"

	showTsLoader(){
		document.getElementById("ts-loader").style.display = "flex";
	}

	hideTsLoader(){
		document.getElementById("ts-loader").style.display = "none";
	}

	@Method()
	async loadTokenscript(source: TokenScriptSource, tsId?: string): Promise<TokenScript> {

		switch(source){
			case "resolve":
				return await this.tsEngine.getTokenScript(tsId);
			case "file":
				return this.loadTokenScriptFromFile();
			case "url":
				return await this.tsEngine.getTokenScriptFromUrl(tsId);
		}
	}

	async loadTokenScriptFromFile(): Promise<TokenScript> {

		return new Promise((resolve, reject) => {

			const file = (document.getElementById("ts-file") as HTMLInputElement).files[0];

			if (file) {
				this.showTsLoader();

				const reader = new FileReader();
				reader.onload = async function (evt) {
					if (typeof evt.target.result === "string") {
						try {
							resolve(await this.tsEngine.loadTokenScript(evt.target.result));
						} catch (e){
							reject("Failed to load TokenScript: " + e.message);
						}
					}
				}.bind(this);

				reader.onerror = function (err) {
					reject("Failed to load file: " + err.message);
				}.bind(this);

				reader.readAsText(file, "UTF-8");

				return;
			}

			resolve(null);
		});
	}

	componentWillLoad(){

		const queryStr = document.location.search.substring(1);
		const query = new URLSearchParams(queryStr);

		switch (query.get("viewType")){
			case "integration":
				this.viewerType = "integration";
				break;
			// Fall-through to default
			case "tabbed":
			default:
				this.viewerType = "tabbed";
		}
	}

	render() {
		return (
			<div class="app-container">
				<header>
					<img class="header-icon" alt="TokenScript icon" src="assets/icon/tokenscript-logo.svg"/>
				</header>

				<main>
					{this.viewerType === "tabbed" ? <tabbed-viewer app={this}></tabbed-viewer> : ''}
					{this.viewerType === "integration" ? <integration-viewer app={this}></integration-viewer> : ''}
				</main>

				<div id="ts-loader">
					<loading-spinner/>
				</div>

				<div id="tn-main" class="overlay-tn"></div>
			</div>
		);
	}
}

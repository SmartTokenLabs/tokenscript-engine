import {Component, Element, h, Host, JSX, Listen, Method, State} from '@stencil/core';
import {TokenScriptEngine} from "../../../../engine-js/src/Engine";

import {EthersAdapter} from "../../../../engine-js/src/wallet/EthersAdapter";
import {TokenScript} from "../../../../engine-js/src/TokenScript";
import {CHAIN_CONFIG} from "../../integration/constants";
import {IWalletAdapter} from "../../../../engine-js/src/wallet/IWalletAdapter";
import {Web3WalletProvider} from "../wallet/Web3WalletProvider";
import {DiscoveryAdapter} from "../../integration/discoveryAdapter";
import {AttestationStorageAdapter} from "../../integration/attestationStorageAdapter";

export type TokenScriptSource = "resolve" | "file" | "url";

export interface ShowToastEventArgs {
	type: 'success'|'info'|'warning'|'error',
	title: string,
	description: string|JSX.Element
}

@Component({
	tag: 'app-root',
	styleUrl: 'app.css',
	shadow: false,
})
export class AppRoot {

	walletSelector: HTMLWalletSelectorElement;

	discoveryAdapter = new DiscoveryAdapter()
	attestationStorageAdapter = new AttestationStorageAdapter();

	constructor() {
		Web3WalletProvider.setWalletSelectorCallback(async () => this.walletSelector.connectWallet());
	}

	async getWalletAdapter(): Promise<IWalletAdapter> {
		return new EthersAdapter(async () => {
			return (await Web3WalletProvider.getWallet(true)).provider;
		}, CHAIN_CONFIG);
	}

	tsEngine = new TokenScriptEngine(
		this.getWalletAdapter,
		async () => this.discoveryAdapter,
		() => this.attestationStorageAdapter ,
		{
			ipfsGateway: "https://smart-token-labs-demo-server.mypinata.cloud/ipfs/",
		}
	);

	@Element() host: HTMLElement;

	@State() viewerType?: "tabbed"|"integration"|"new"

	@Listen("showLoader")
	showLoaderHandler(_event: CustomEvent<void>){
		this.showTsLoader();
	}

	showTsLoader(){
		document.getElementById("ts-loader").style.display = "flex";
	}

	@Listen("hideLoader")
	hideLoaderHandler(_event: CustomEvent<void>){
		this.hideTsLoader();
	}

	hideTsLoader(){
		document.getElementById("ts-loader").style.display = "none";
	}

	@Method()
	async loadTokenscript(source: TokenScriptSource, tsId?: string, file?: File|string): Promise<TokenScript> {

		switch(source){
			case "resolve":
				return this.tsEngine.getTokenScript(tsId);
			case "file":
				if (typeof file === "string"){
					return this.tsEngine.loadTokenScript(file);
				} else {
					return this.loadTokenScriptFromFile(file);
				}
			case "url":
				return this.tsEngine.getTokenScriptFromUrl(tsId);
		}
	}

	async loadTokenScriptFromFile(file: File): Promise<TokenScript> {

		return new Promise((resolve, reject) => {

			// const file = (document.getElementById("ts-file") as HTMLInputElement).files[0];

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

			reject("No file selected");
		});
	}

	@Listen("showToast")
	showToastHandler(event: CustomEvent<ShowToastEventArgs>){
		this.showToast(event.detail.type, event.detail.title, event.detail.description);
	}

	@Method()
	async showToast(type: 'success'|'info'|'warning'|'error', title: string, description: string|JSX.Element){

		const cbToast = document.querySelector(".toast") as HTMLCbToastElement;

		cbToast.Toast({
			title,
			description,
			timeOut: 30000,
			position: 'top-right',
			type
		});
	}

	async componentWillLoad(){

		const queryStr = document.location.search.substring(1);
		const query = new URLSearchParams(queryStr);

		switch (query.get("viewType")){
			case "integration":
				this.viewerType = "integration";
				break;
			case "tabbed":
				this.viewerType = "tabbed";
				break;
			// Fall-through to default
			case "new":
			default:
				this.viewerType = "new";
		}

		await Web3WalletProvider.loadConnections();
	}

	render() {
		return (
			<Host>
				<div class="app-container">
					<cb-toast class="toast" style={{zIndex: "500"}}></cb-toast>
					<header>
						<img class="header-icon" alt="TokenScript icon" src="assets/icon/tokenscript-logo.svg"/>
					</header>

					<main>
						{this.viewerType === "tabbed" ? <tabbed-viewer app={this}></tabbed-viewer> : ''}
						{this.viewerType === "integration" ? <integration-viewer app={this}></integration-viewer> : ''}
						{this.viewerType === "new" ? <new-viewer app={this}></new-viewer> : ''}
					</main>

					<div id="ts-loader">
						<loading-spinner/>
					</div>
				</div>
				<wallet-selector ref={(el) => this.walletSelector = el}></wallet-selector>
			</Host>
		);
	}
}

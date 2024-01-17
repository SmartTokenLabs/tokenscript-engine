import "../../integration/rum"

import {Component, Element, h, Host, JSX, Listen, Method} from '@stencil/core';
import {TokenScriptEngine} from "../../../../engine-js/src/Engine";

import {EthersAdapter} from "../../../../engine-js/src/wallet/EthersAdapter";
import {TokenScript} from "../../../../engine-js/src/TokenScript";
import {CHAIN_CONFIG} from "../../integration/constants";
import {IWalletAdapter} from "../../../../engine-js/src/wallet/IWalletAdapter";
import {DiscoveryAdapter} from "../../integration/discoveryAdapter";
import {AttestationStorageAdapter} from "../../integration/attestationStorageAdapter";
import {IFrameEthereumProvider} from "../../integration/IframeEthereumProvider";
import {ethers} from "ethers";
import {ITokenDiscoveryAdapter} from "@tokenscript/engine-js/src/tokens/ITokenDiscoveryAdapter";

export type TokenScriptSource = "resolve" | "file" | "url";

export interface ShowToastEventArgs {
	type: 'success'|'info'|'warning'|'error',
	title: string,
	description: string|JSX.Element
}

export type ViewerTypes = "tabbed"|"integration"|"new"|"joyid-token"|"opensea"|"sts-token"|"alphawallet";

const IFRAME_PROVIDER_VIEWS: ViewerTypes[] = ["joyid-token", "sts-token"];

const initViewerType = (params: URLSearchParams): ViewerTypes => {

	let viewerType;

	switch (params.get("viewType")){
		case "integration":
			viewerType = "integration";
			break;
		case "tabbed":
			viewerType = "tabbed";
			break;
		case "joyid-token":
			viewerType = "joyid-token";
			break;
		case "opensea":
			viewerType = "opensea";
			break;
		case "sts-token":
			viewerType = "sts-token";
			break;
		case "alphawallet":
			viewerType = "alphawallet";
			break;
		// Fall-through to default
		case "new":
		default:
			viewerType = "new";
	}

	return viewerType
}

@Component({
	tag: 'app-root',
	styleUrl: 'app.css',
	shadow: false,
})
export class AppRoot {

	walletSelector: HTMLWalletSelectorElement;

	discoveryAdapter: ITokenDiscoveryAdapter = new DiscoveryAdapter()
	attestationStorageAdapter = new AttestationStorageAdapter();

	private iframeProvider: ethers.providers.Web3Provider;

	private params = new URLSearchParams(document.location.search);
	private viewerType: ViewerTypes = initViewerType(this.params);

	public readonly tsEngine: TokenScriptEngine;

	constructor() {

		this.tsEngine = new TokenScriptEngine(
			async () => this.getWalletAdapter(),
			async () => this.discoveryAdapter,
			() => this.attestationStorageAdapter,
			{
				noLocalStorage: this.viewerType === "opensea"
			}
		);
	}

	async getWalletAdapter(): Promise<IWalletAdapter> {

		let providerFactory;

		if (IFRAME_PROVIDER_VIEWS.indexOf(this.viewerType) > -1 && !this.params.has("noIframeProvider")){
			providerFactory = async () => {
				if (!this.iframeProvider)
					this.iframeProvider = new ethers.providers.Web3Provider(new IFrameEthereumProvider(), "any");
				return this.iframeProvider;
			}
		} else if (this.viewerType === "opensea") {
			providerFactory = async () => {
				throw new Error("PROVIDER DISABLED")
			}
		} else if (this.viewerType === "alphawallet") {
			// Automatically connect to injected web3 provider
			providerFactory = async () => {
				const WalletProvider = (await import("../wallet/Web3WalletProvider")).Web3WalletProvider;
				if (!WalletProvider.isWalletConnected())
					await WalletProvider.connectWith("MetaMask");
				return (await WalletProvider.getWallet(true)).provider;
			}
		} else {
			providerFactory = async () => {
				return (await (await import("../wallet/Web3WalletProvider")).Web3WalletProvider.getWallet(true)).provider;
			}
		}

		return new EthersAdapter(providerFactory, CHAIN_CONFIG);
	}

	@Element() host: HTMLElement;

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

	async componentDidLoad(){

		//const queryStr = document.location.search.substring(1);
		//const query = new URLSearchParams(queryStr);

		if (IFRAME_PROVIDER_VIEWS.indexOf(this.viewerType) === -1 && !this.params.has("noIframeProvider") && this.viewerType !== "opensea"){
			const Web3WalletProvider = (await import("../wallet/Web3WalletProvider")).Web3WalletProvider;
			Web3WalletProvider.setWalletSelectorCallback(async () => this.walletSelector.connectWallet());
			await Web3WalletProvider.loadConnections();
		}
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
						{this.viewerType === "joyid-token" ? <token-viewer app={this}></token-viewer> : ''}
						{this.viewerType === "sts-token" ? <sts-viewer app={this}></sts-viewer> : ''}
						{this.viewerType === "opensea" ? <opensea-viewer app={this}></opensea-viewer> : ''}
						{this.viewerType === "alphawallet" ? <alphawallet-viewer app={this}></alphawallet-viewer> : ''}
					</main>

					<div id="ts-loader">
						<loading-spinner/>
					</div>
				</div>
				{ IFRAME_PROVIDER_VIEWS.indexOf(this.viewerType) === -1 &&
					!this.params.has("noIframeProvider") &&
					this.viewerType !== "opensea" ?
						<wallet-selector ref={(el) => this.walletSelector = el}></wallet-selector> : ''
				}
			</Host>
		);
	}
}

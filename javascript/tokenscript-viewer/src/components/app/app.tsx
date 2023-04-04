import {Component, Element, h, Method} from '@stencil/core';
import {TokenScriptEngine} from "../../../../engine-js/src/Engine";

import {Client} from "@tokenscript/token-negotiator";
import "@tokenscript/token-negotiator/dist/theme/style.css";

import {EthersAdapter} from "../../../../engine-js/src/wallet/EthersAdapter";
import {TokenScript} from "../../../../engine-js/src/TokenScript";
import {CHAIN_CONFIG} from "../../integration/constants";
import {IWalletAdapter} from "../../../../engine-js/src/wallet/IWalletAdapter";

interface TabInstance {
	tabHeader: HTMLTabHeaderItemElement
	content: HTMLViewerTabElement
}

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

	tabs: {[id: string]: TabInstance} = {};

	@Method()
	async showTab(id: string){

		if (id !== "start-tab" && !this.tabs[id])
			return;

		let children = this.host.querySelector("#tab-header").children;

		for (let i=0; i < children.length; i++)
			children[i].classList.remove("active");

		children = this.host.querySelector("#tab-content").children;

		for (let i=0; i < children.length; i++)
			children[i].classList.remove("active");

		if (id === "start-tab"){
			this.host.querySelector("#start-tab-header").classList.add("active");
			this.host.querySelector("#start-tab").classList.add("active");
		} else {
			this.tabs[id].tabHeader.classList.add("active");
			this.tabs[id].content.classList.add("active");
		}
	}

	private addTab(tokenScript: TokenScript, emulator: string){

		const id = Date.now().toString();

		const query = new URLSearchParams(document.location.search);
		const component = query.has("debugTab") ? "debug-viewer-tab" : "viewer-tab";

		const tab = this.tabs[id] = {
			tabHeader: document.createElement("tab-header-item", {is: "tab-header-item"}) as HTMLTabHeaderItemElement,
			content: document.createElement(component, {is: component}) as HTMLViewerTabElement
		};

		tab.tabHeader.app = this;
		tab.tabHeader.tabId = id;
		tab.tabHeader.tabTitle = tokenScript.getLabel();

		tab.content.app = this;
		tab.content.tabId = id;
		tab.content.tokenScript = tokenScript;

		this.host.querySelector("#tab-header").appendChild(tab.tabHeader);
		this.host.querySelector("#tab-content").appendChild(tab.content);

		this.showTab(id);

		if (emulator)
			this.connectEmulatorSocket(id, emulator);
	}

	@Method()
	async closeTab(id: string){

		if (!this.tabs[id])
			return;

		const tab = this.tabs[id];

		tab.tabHeader.remove();
		tab.content.remove();
		delete this.tabs[id];

		const tabIds = Object.keys(this.tabs);

		await this.showTab(tabIds.length === 0 ? "start-tab" : tabIds[tabIds.length - 1]);
	}

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

	@Method()
	async openTokenScriptTab(source: TokenScriptSource, tsId?: string, emulator?: string){

		this.showTsLoader();

		try {
			const tokenScript = await this.loadTokenscript(source, tsId)
			this.addTab(tokenScript, emulator);
		} catch (e){
			console.error(e);
			alert("Failed to load TokenScript: " + e.message);
		}

		this.hideTsLoader();
	}

	async connectEmulatorSocket(tabId: string, host: string){

		try {
			const webSocket = new WebSocket("ws://" + new URL(host).host + "/ws");

			webSocket.onopen = (event) => {
				console.log("connected: ", event.type);
				webSocket.send("Websocket client connected!");
			};

			webSocket.onmessage = async (event) => {

				if (event.data != "BUILD_UPDATED")
					return;

				// TODO: Implement build started and build error events
				try {
					this.tabs[tabId].content.tokenScript = await this.loadTokenscript("url", host + "/tokenscript.tsml");
				} catch (e){
					console.error(e);
					alert("Failed to reload TokenScript changes");
				}
			}
		} catch (e){
			console.error(e);
		}
	}

	render() {
		return (
			<div class="app-container">
				<header>
					<img class="header-icon" alt="TokenScript icon" src="assets/icon/tokenscript-logo.svg"/>
				</header>

				<main>
					<div id="tab-header">
						<tab-header-item id="start-tab-header" class="active" tabId="start-tab" app={this} tabTitle="Start" closable={false} />
					</div>
					<div id="tab-content">
						<start-tab id="start-tab" tabId="start-tab" class="active" app={this} />
					</div>
				</main>

				<div id="ts-loader">
					<loading-spinner/>
				</div>

				<div id="tn-main" class="overlay-tn"></div>
			</div>
		);
	}
}

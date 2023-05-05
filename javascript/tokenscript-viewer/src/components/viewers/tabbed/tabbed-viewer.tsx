import {Component, Element, h, Method, Prop} from "@stencil/core";
import {AppRoot, TokenScriptSource} from "../../app/app";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";

interface TabInstance {
	tabHeader: HTMLTabHeaderItemElement
	content: HTMLViewerTabElement
}

@Component({
	tag: 'tabbed-viewer',
	styleUrl: 'tabbed-viewer.css',
	shadow: false,
	scoped: false
})
export class TabbedViewer {

	private tabs: {[id: string]: TabInstance} = {};

	@Element() host: HTMLElement;

	@Prop() app: AppRoot;

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

	@Method()
	async openTokenScriptTab(source: TokenScriptSource, tsId?: string, file?: File, emulator?: string){

		this.app.showTsLoader();

		try {
			const tokenScript = await this.app.loadTokenscript(source, tsId)
			this.addTab(tokenScript, emulator);
		} catch (e){
			console.error(e);
			alert("Failed to load TokenScript: " + e.message);
		}

		this.app.hideTsLoader();
	}

	private addTab(tokenScript: TokenScript, emulator: string){

		const id = Date.now().toString();

		const query = new URLSearchParams(document.location.search);

		const tab = this.tabs[id] = {
			tabHeader: document.createElement("tab-header-item", {is: "tab-header-item"}) as HTMLTabHeaderItemElement,
			content: document.createElement("viewer-tab", {is: "viewer-tab"}) as HTMLViewerTabElement
		};

		tab.tabHeader.tabView = this;
		tab.tabHeader.tabId = id;
		tab.tabHeader.tabTitle = tokenScript.getLabel();

		tab.content.app = this.app;
		tab.content.tabId = id;
		tab.content.tokenScript = tokenScript;

		this.host.querySelector("#tab-header").appendChild(tab.tabHeader);
		this.host.querySelector("#tab-content").appendChild(tab.content);

		this.showTab(id);

		if (emulator)
			this.connectEmulatorSocket(id, emulator);
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
					this.tabs[tabId].content.tokenScript = await this.app.loadTokenscript("url", host + "/tokenscript.tsml");
				} catch (e){
					console.error(e);
					alert("Failed to reload TokenScript changes");
				}
			}
		} catch (e){
			console.error(e);
		}
	}

	processUrlLoad(){

		console.log("loading from URL: " + document.location.hash);
		const queryStr = document.location.search.substring(1);

		if (!queryStr)
			return false;

		const query = new URLSearchParams(queryStr);

		if (query.has("emulator")) {

			console.log("Emulator mode enabled!");

			let tsHost = query.get("emulator");

			if (tsHost) {
				tsHost = new URL(tsHost).origin;
				console.log("Using remote host for tokenscript dev server: " + tsHost);
			} else {
				tsHost = document.location.origin;
			}

			this.openTokenScriptTab("url", tsHost + "/tokenscript.tsml", null, tsHost);
			//connectSocket(tsHost);

			return true;

		} else if (query.has("tokenscriptUrl")){

			this.openTokenScriptTab("url", query.get("tokenscriptUrl"));

			return true;
		} else if (query.has("chain") && query.has("contract")){

			const tsId = query.get("chain") + "-" + query.get("contract");

			this.openTokenScriptTab("resolve", tsId);

			return true;
		}

		return false;
	}

	componentDidLoad(){
		this.processUrlLoad();
	}

	render(){
		return (
			[
				<div id="tab-header">
					<tab-header-item id="start-tab-header" class="active" tabId="start-tab" tabView={this} tabTitle="Start" closable={false}/>
				</div>,
				<div id="tab-content">
					<start-tab id="start-tab" tabId="start-tab" class="active" tabView={this} />
				</div>
			]
		);
	}
}

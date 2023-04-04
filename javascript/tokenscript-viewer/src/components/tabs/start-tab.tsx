import {Component, Element, h, Prop} from "@stencil/core";
import {Components} from "../../components";
import AppRoot = Components.AppRoot;
import {CHAIN_NAME_MAP} from "../../integration/constants";


@Component({
	tag: 'start-tab',
	styleUrl: 'start-tab.css',
	shadow: false,
})
export class StartTab {

	@Prop() app: AppRoot;
	@Prop() tabId: string;

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

			this.app.openTokenScriptTab("url", tsHost + "/tokenscript.tsml", tsHost);
			//connectSocket(tsHost);

			return true;

		} else if (query.has("tokenscriptUrl")){

			this.app.openTokenScriptTab("url", query.get("tokenscriptUrl"));

			return true;
		} else if (query.has("chain") && query.has("contract")){

			const tsId = query.get("chain") + "-" + query.get("contract");

			this.app.openTokenScriptTab("resolve", tsId);

			return true;
		}

		return false;
	}

	componentDidLoad(){

		const tsFile = document.getElementById("ts-file") as HTMLInputElement;

		if (this.processUrlLoad()) {
			tsFile.value = "";
		} else {
			if (tsFile.value)
				this.app.openTokenScriptTab("file");
		}
	}

	render() {
		return (
			<div>
				<div class="start-section">
					<h2>Welcome to TokenScript Viewer</h2>
					<p>
						TokenScript Viewer is an easy way to run TokenScripts in your browser if you don't have a TokenScript compatible wallet.<br/>
						If you want to try TokenScripts in your wallet, you can download <a href="https://alphawallet.com/" target="_blank">AlphaWallet</a> for Android and iOS.
					</p>
					<h3>What is TokenScript?</h3>
					<p>
						TokenScript is a framework for providing rich, embedded & secure token utility for blockchain & attestation tokens.<br/>
						Simply put, it's a new way of writing DApps which provides UX & security benefits for users by cryptographically tying the frontend to the smart contract or attestation issuer.<br/>
					</p>
					<p>
						For more information please visit <a href="https://www.tokenscript.org/" target="_blank">https://www.tokenscript.org/</a>
					</p>
				</div>
				<div class="start-section">
					<h3>Load a TokenScript</h3>
					<div class="start-sub-section">
						<h4>Load with contract ID</h4>
						<label htmlFor="ts-id">Tokenscript ID: </label>
						<input style={{marginRight: "15px"}} id="ts-id" type="text" value=""/>
						<label htmlFor="ts-chain">Chain: </label>
						<select id="ts-chain" style={{marginRight: "15px"}}>
							{Object.entries(CHAIN_NAME_MAP).map((chain) => ((<option value={chain[0]}>{chain[1]}</option>)))}
						</select>
						<button id="ts-resolve-btn" type="button" class="btn btn-primary" onClick={() => {
							const tsId = (document.getElementById('ts-chain') as HTMLSelectElement).value + "-" +
											(document.getElementById('ts-id') as HTMLInputElement).value;
							this.app.openTokenScriptTab("resolve", tsId);
						}}>Resolve</button>
					</div>
					<div class="start-sub-section">
						<h4>Load from URL</h4>
						<label htmlFor="ts-url">URL: </label>
						<input id="ts-url" type="text" style={{marginRight: "15px"}} />
						<button id="ts-load-url-btn" type="button" class="btn btn-primary" onClick={() => {
							const url = (document.getElementById('ts-url') as HTMLSelectElement).value;
							this.app.openTokenScriptTab("url", url);
						}}>Load</button>
					</div>
					<div class="start-sub-section">
						<h4>Load from file</h4>
						<label htmlFor="ts-file">Load XML: </label><input id="ts-file" type="file" accept=".xml,.tsml,text/xml" onChange={() => {
							this.app.openTokenScriptTab("file")
						}}/>
					</div>
					<div class="start-sub-section">
						<h4>Load Predefined TokenScripts </h4>
						<label htmlFor="ts-predefined"></label>
						<select id="ts-predefined" style={{marginRight: "15px"}}>
							<option value="DAI">DAI</option>
							<option value="ENS">ENS</option>
						</select>
						<button id="ts-load-predefined-btn" type="button" class="btn btn-primary" onClick={() => {
							const tsId = (document.getElementById('ts-predefined') as HTMLSelectElement).value;
							this.app.openTokenScriptTab("resolve", tsId);
						}}>Load</button>
					</div>
				</div>
			</div>
		);
	}
}

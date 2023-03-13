import {Component, Element, h, Prop} from "@stencil/core";
import {Components} from "../../components";
import AppRoot = Components.AppRoot;


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
					<h3>Load with contract ID</h3>
					<label htmlFor="ts-id">Tokenscript ID: </label>
					<input style={{marginRight: "15px"}} id="ts-id" type="text" value="0xd915c8ad3241f459a45adcbbf8af42caa561a154"/>
					<label htmlFor="ts-chain">Chain: </label>
					<select id="ts-chain" style={{marginRight: "15px"}}>
						<option value="1">Ethereum Mainnet</option>
						<option value="5">Goerli Testnet</option>
						<option value="8217" selected>Klaytn Mainnet</option>
					</select>
					<button id="ts-resolve-btn" type="button" onClick={() => {
						const tsId = (document.getElementById('ts-chain') as HTMLSelectElement).value + "-" +
										(document.getElementById('ts-id') as HTMLInputElement).value;
						this.app.openTokenScriptTab("resolve", tsId);
					}}>Resolve</button>
				</div>
				<div class="start-section">
					<h3>Load from URL</h3>
					<label htmlFor="ts-url">URL: </label>
					<input id="ts-url" type="text" style={{marginRight: "15px"}} />
					<button id="ts-load-url-btn" type="button" onClick={() => {
						const url = (document.getElementById('ts-url') as HTMLSelectElement).value;
						this.app.openTokenScriptTab("url", url);
					}}>Load</button>
				</div>
				<div class="start-section">
					<h3>Load from file</h3>
					<label htmlFor="ts-file">Load XML: </label><input id="ts-file" type="file" accept=".xml,.tsml,text/xml" onChange={() => {
						this.app.openTokenScriptTab("file")
					}}/>
				</div>
				<div class="start-section">
					<h3>Load Predefined TokenScripts </h3>
					<label htmlFor="ts-predefined"></label>
					<select id="ts-predefined" style={{marginRight: "15px"}}>
						<option value="DAI">DAI</option>
						<option value="ENS">ENS</option>
					</select>
					<button id="ts-load-predefined-btn" type="button" onClick={() => {
						const tsId = (document.getElementById('ts-predefined') as HTMLSelectElement).value;
						this.app.openTokenScriptTab("resolve", tsId);
					}}>Load</button>
				</div>
			</div>
		);
	}
}

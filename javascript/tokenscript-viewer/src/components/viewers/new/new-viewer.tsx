import {Component, h, Prop, State, Watch} from "@stencil/core";
import {AppRoot} from "../../app/app";
import {knownTokenScripts} from "../../../constants/knownTokenScripts";
import {dbProvider, TokenScriptsMeta} from "../../../providers/databaseProvider";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {WalletConnection, Web3WalletProvider} from "../../wallet/Web3WalletProvider";

type LoadedTokenScript = (TokenScriptsMeta & {numTokens?: number, tokenScript?: TokenScript});

@Component({
	tag: 'new-viewer',
	styleUrl: 'new-viewer.css',
	shadow: false,
	scoped: false
})
export class NewViewer {

	@Prop()
	app: AppRoot;

	private addDialog: HTMLAddSelectorElement;

	@State()
	private myTokenScripts: {[tsId: string]: LoadedTokenScript} = {};

	@State()
	private popularTokenscripts: TokenScriptsMeta[] = [];

	async componentWillLoad(){

		// TODO: Temp for testing
		// await dbProvider.myTokenScripts.clear()

		const tokenScriptsMap = {};

		this.app.showTsLoader();

		for (const tsMeta of await dbProvider.myTokenScripts.toArray()){

			// TODO: Support URL & File loading
			const tokenScript = await this.app.loadTokenscript('resolve', tsMeta.tokenScriptId);

			tokenScriptsMap[tsMeta.tokenScriptId] = {...tsMeta, tokenScript};
		}

		this.myTokenScripts = tokenScriptsMap;

		this.app.hideTsLoader();

		Web3WalletProvider.registerWalletChangeListener(async (walletConnection?: WalletConnection) => {
			for (const id in this.myTokenScripts){
				if (walletConnection){
					this.myTokenScripts[id].tokenScript.getTokenMetadata(true);
				} else {
					this.myTokenScripts[id].tokenScript.setTokenMetadata([]);
				}
			}
		})
	}

	@Watch("myTokenScripts")
	private recalculatePopularTokenScripts(){

		this.popularTokenscripts = knownTokenScripts.filter((tsMeta) => {
			return !this.myTokenScripts[tsMeta.tokenScriptId];
		})
	}

	private async addPopularTokenScript(tsMeta: TokenScriptsMeta){

		this.app.showTsLoader();

		const tokenScript = await this.app.loadTokenscript('resolve', tsMeta.tokenScriptId);

		dbProvider.myTokenScripts.put(tsMeta);

		const loadedTs: LoadedTokenScript = {...tsMeta, tokenScript};

		this.myTokenScripts = {...this.myTokenScripts, [loadedTs.tokenScriptId]: loadedTs};

		this.app.hideTsLoader();
	}

	render(){
		return (
			<div class="nv-container">
				<h3>TokenScript Viewer</h3>
				<p>Connect your wallet to use your TokenScript enabled tokens</p>
				<div class="toolbar">
					<wallet-button></wallet-button>
					<button class="btn" onClick={() => {
						this.addDialog.openTokenScript();
					}}>+ Add Token
					</button>
				</div>
				<div>
					<h5>Your Tokens</h5>
					<br/>
					<tokenscript-grid>
						{
							Object.values(this.myTokenScripts).map((ts) => {
								return (
									<tokenscript-button
										name={ts.name}
										imageUrl={ts.iconUrl}
										tokenScript={ts.tokenScript}
										onClick={() => {
											console.log("Open tokenscript");
										}}>
									</tokenscript-button>
								);
							})
						}
					</tokenscript-grid>
				</div>
				<div>
					<h5>Popular TokenScripts</h5>
					<br/>
					<tokenscript-grid>
						{
							this.popularTokenscripts.map((ts) => {
								return (
									<tokenscript-button
										name={ts.name}
										imageUrl={ts.iconUrl}
										onClick={() => {
											this.addPopularTokenScript(ts);
										}}>
									</tokenscript-button>
								);
							})
						}
					</tokenscript-grid>
				</div>
				<add-selector ref={el => this.addDialog = el as HTMLAddSelectorElement}></add-selector>
			</div>
		);
	}

}

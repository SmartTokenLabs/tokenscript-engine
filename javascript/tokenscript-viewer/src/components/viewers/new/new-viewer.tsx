import {Component, h, Prop, State, Watch} from "@stencil/core";
import {AppRoot, TokenScriptSource} from "../../app/app";
import {getKnownTokenScriptMetaById, knownTokenScripts} from "../../../constants/knownTokenScripts";
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

	componentWillLoad(){

		// TODO: Temp for testing
		// await dbProvider.myTokenScripts.clear()

		this.init();
	}

	private async init(){

		const tokenScriptsMap = {};

		this.app.showTsLoader();

		for (const tsMeta of await dbProvider.myTokenScripts.toArray()){

			try {
				const tokenScript = await this.app.loadTokenscript(tsMeta.loadType, tsMeta.tokenScriptId, tsMeta.xml);

				tokenScriptsMap[tsMeta.tokenScriptId] = {...tsMeta, tokenScript};
			} catch (e){
				console.error("Failed to load TokenScript definition: ", tsMeta.name);
			}
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

		try {
			const tokenScript = await this.app.loadTokenscript('resolve', tsMeta.tokenScriptId);

			await this.addTokenScript(tsMeta, tokenScript);
		} catch (e){
			console.error(e);
			alert(e.message); // TODO: Add proper error dialog or toast
		}

		this.app.hideTsLoader();
	}

	private async addTokenScript(tsMeta: TokenScriptsMeta, tokenScript: TokenScript){

		await dbProvider.myTokenScripts.put(tsMeta);

		const loadedTs: LoadedTokenScript = {...tsMeta, tokenScript};

		this.myTokenScripts = {...this.myTokenScripts, [loadedTs.tokenScriptId]: loadedTs};
	}

	private async removeTokenScript(tsId: string){

		await dbProvider.myTokenScripts.where("tokenScriptId").equals(tsId).delete();

		const tokenScripts = this.myTokenScripts;
		delete tokenScripts[tsId];

		this.myTokenScripts = {...this.myTokenScripts};
	}

	private async addFormSubmit(type: TokenScriptSource, data: {tsId: string, xml?: File}){

		this.app.showTsLoader();

		try {
			const tokenScript = await this.app.loadTokenscript(type, data.tsId, data.xml);

			// TODO: Use better UID for non-resolved tokenscripts
			const tokenScriptId = data.tsId ?? tokenScript.getName();

			let meta: TokenScriptsMeta = getKnownTokenScriptMetaById(tokenScriptId)

			if (!meta) {
				meta = {
					tokenScriptId: data.tsId ?? tokenScript.getName(),
					loadType: type,
					name: tokenScript.getName() ?? tokenScript.getLabel() ?? "Unknown TokenScript",
					xml: type === "file" ? tokenScript.getXmlString() : null
				};

				// TODO: Add collection logo as default icon
			}

			await this.addTokenScript(meta, tokenScript);

			await this.addDialog.closeDialog();

		} catch (e){
			console.error(e);
			alert(e.message); // TODO: Add proper error dialog or toast
		}

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
						this.addDialog.openDialog();
					}}>+ Add Token
					</button>
				</div>
				<div>
					<div style={{display: "flex", justifyContent: "space-between"}}>
						<h5>Your Tokens</h5>
						<button class="btn" style={{marginRight: "5px", minWidth: "35px", fontSize: "16px"}}
								onClick={() => {
									for (const id in this.myTokenScripts){
										this.myTokenScripts[id].tokenScript.getTokenMetadata(true, true);
									}
								}}>↻</button>
					</div>
					<br/>
					<tokenscript-grid>
						{
							Object.values(this.myTokenScripts).map((ts) => {
								return (
									<tokenscript-button
										tsId={ts.tokenScriptId}
										name={ts.name}
										imageUrl={ts.iconUrl}
										tokenScript={ts.tokenScript}
										onClick={() => {
											console.log("Open tokenscript");
										}}
										onRemove={async (tsId: string) => {
											this.removeTokenScript(tsId);
										}}>
									</tokenscript-button>
								);
							})
						}
					</tokenscript-grid>
				</div>
				{ this.popularTokenscripts.length > 0 ?
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
					</div> : ''
				}
				<add-selector ref={el => this.addDialog = el as HTMLAddSelectorElement} onFormSubmit={this.addFormSubmit.bind(this)}></add-selector>
			</div>
		);
	}

}

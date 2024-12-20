import {Component, Event, EventEmitter, h, Host, Listen, Prop, State, Watch} from "@stencil/core";
import {AppRoot, ShowToastEventArgs, TokenScriptSource} from "../../app/app";
import {getKnownTokenScriptMetaById, knownTokenScripts} from "../../../constants/knownTokenScripts";
import {dbProvider, TokenScriptsMeta} from "../../../providers/databaseProvider";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {WalletConnection, Web3WalletProvider} from "../../wallet/Web3WalletProvider";
import {DiscoveryAdapter} from "../../../integration/discoveryAdapter";
import {CHAIN_MAP} from "../../../integration/constants";
import {connectEmulatorSocket} from "../util/connectEmulatorSocket";
import { decodeSafeBase64QueryString } from '../util/tgUrl';
import { patchOpen } from '../util/patchOpen';
import {ScriptInfo} from "@tokenscript/engine-js/src/repo/sources/SourceInterface";

type LoadedTokenScript = (TokenScriptsMeta & {tokenScript?: TokenScript});

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

	private viewerPopover: HTMLViewerPopoverElement;

	private aboutDialog: HTMLPopoverDialogElement;

	private scriptSelectDialog: HTMLScriptSelectDialogElement;

	@State()
	private myTokenScripts: {[tsId: string]: LoadedTokenScript} = {};

	@State()
	private scriptsLoading = true;

	@State()
	private popularTokenscripts: TokenScriptsMeta[] = [];

	@Event({
		eventName: 'showToast',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) showToast: EventEmitter<ShowToastEventArgs>;

	@Listen("showScriptSelector")
	showScriptSelector(event: CustomEvent<ScriptInfo[]>){
		this.scriptSelectDialog.open(event.detail)
	}

	componentWillLoad(){
		Web3WalletProvider.registerWalletChangeListener(async (walletConnection?: WalletConnection) => {
			for (const id in this.myTokenScripts){

				if (!this.myTokenScripts[id].tokenScript)
					continue;

				this.myTokenScripts[id].tokenScript.getAttributes().invalidate(["walletAddress", "ownerAddress"]);
				this.myTokenScripts[id].tokenScript.getCards().getAllCards().forEach((card) => {
					card.getAttributes().invalidate(["walletAddress", "ownerAddress"]);
				})

				this.myTokenScripts[id].tokenScript.getTokenMetadata(true);
			}
		})
		this.processUrlLoad().then(() => this.init());
	}


	componentDidLoad() {
		// if it's coming from Telegram, then we redirect to the url with query params
		const urlParams = new URLSearchParams(window.location.search);
		const startParam = urlParams.get('tgWebAppStartParam');
		if (startParam) {
			patchOpen()
			const query = decodeSafeBase64QueryString(startParam);
			window.location.href = `${window.location.origin}${window.location.pathname}?${query}`;
		}
	}


	private async processUrlLoad(){

		// TODO: Support attestation in hash parameters too
		const queryStr = document.location.search.substring(1);

		if (!queryStr)
			return;

		const query = new URLSearchParams(queryStr);
		let tsMeta;

		if (query.has("ticket") || query.has("attestation")) {

			this.app.showTsLoader();

			try {

				const {definition, tokenScript} = await this.app.tsEngine.importAttestationUsingTokenScript(query);

				// Import completed successfully, add tokenscript to myTokenScripts
				tsMeta = await this.addFormSubmit("url", {tsId: tokenScript.getSourceInfo().tsId, image: definition.meta.image});

				//document.location.hash = "";
				window.history.replaceState({}, document.title, "/");

				this.showToast.emit({
					type: "success",
					title: "Attestation imported",
					description: "Successfully imported " + definition.meta.name
				});

			} catch (e){
				console.error(e);
				this.app.hideTsLoader();
				this.showToast.emit({
					type: "error",
					title: "Failed to import attestation",
					description: e.message
				});
				return;
			}

		} else if (query.has("tokenscriptUrl")){
			tsMeta = await this.addFormSubmit("url", {tsId: query.get("tokenscriptUrl")})
		} else if (query.has("tsId")){
			tsMeta = await this.addFormSubmit("resolve", {tsId: query.get("tsId")}, true);
		} else if (query.has("chain") && query.has("contract")){
			const tsId = query.get("chain") + "-" + query.get("contract") + (query.has("scriptId") ? "-" + query.get("scriptId") : "");
			tsMeta = await this.addFormSubmit("resolve", {tsId}, true);
		} else if (query.has("emulator")){
			const emulator = query.get("emulator") ? new URL(decodeURIComponent(query.get("emulator"))).origin : document.location.origin;
			const tsId = emulator + "/tokenscript.tsml";
			tsMeta = await this.addFormSubmit("url", {tsId})
			connectEmulatorSocket(emulator, async() => {
				await this.addFormSubmit("url", {tsId});
			});
		}

		console.log("open TS", tsMeta);
	}

	private async init(){

		const myTokenScripts = await dbProvider.myTokenScripts.toArray();

		await Promise.all(myTokenScripts.map((tsMeta) => this.loadMyTokenScript(tsMeta)))

		this.scriptsLoading = false;
	}

	private async loadMyTokenScript(tsMeta: TokenScriptsMeta){

		if (this.myTokenScripts[tsMeta.tokenScriptId])
			return; // This script has already been loaded via processUrlLoad

		try {
			const tokenScript = await this.app.loadTokenscript(tsMeta.loadType, tsMeta.tokenScriptId, tsMeta.xml);

			this.myTokenScripts = {...this.myTokenScripts, [tsMeta.tokenScriptId]: {...tsMeta, tokenScript}};
		} catch (e){
			console.error("Failed to load TokenScript definition: ", tsMeta.name);

			if (tsMeta.loadType == "url" && new URL(tsMeta.tokenScriptId).hostname === "localhost")
				return;

			this.myTokenScripts = {...this.myTokenScripts, [tsMeta.tokenScriptId]: tsMeta};
		}
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

		// TODO: Replace with dialog
		if (!confirm("Are you sure you want to remove this TokenScript?"))
			return;

		await dbProvider.myTokenScripts.where("tokenScriptId").equals(tsId).delete();

		const tokenScripts = this.myTokenScripts;
		delete tokenScripts[tsId];

		this.myTokenScripts = {...this.myTokenScripts};
	}

	private async discoverScripts(tsPath: string){

		this.app.showTsLoader();

		const scripts = await this.app.tsEngine.resolveAllScripts(tsPath);

		if (scripts.length === 1)
			return await this.addFormSubmit("resolve", {tsId: tsPath + "-" + scripts[0].scriptId});

		await this.addDialog.closeDialog();
		await this.scriptSelectDialog.open(scripts);
		this.app.hideTsLoader();
	}

	private async addFormSubmit(type: TokenScriptSource, data: {tsId?: string, xml?: File, image?: string}, loadDefault = false){

		this.app.showTsLoader();

		try {
			if (!loadDefault && type === "resolve" && data.tsId && data.tsId.split("-").length < 3){
				await this.discoverScripts(data.tsId);
				return;
			}

			const tokenScript = await this.app.loadTokenscript(type, data.tsId, data.xml);

			const tokenScriptId = tokenScript.getSourceInfo().tsId;

			let meta: TokenScriptsMeta = getKnownTokenScriptMetaById(tokenScriptId)

			if (!meta) {
				meta = {
					tokenScriptId,
					loadType: type,
					name: tokenScript.getLabel(2) ?? tokenScript.getName() ?? "Unknown TokenScript",
					xml: type === "file" ? tokenScript.getXmlString() : null
				};

				// TODO: This can possibly be moved to tokenscript-button component to allow dynamic update of the icon after it has been added
				if (data.image) {
					meta.iconUrl = data.image;
				} else if (tokenScript.getMetadata().iconUrl && tokenScript.getMetadata().iconUrl.trim()) {
					meta.iconUrl = tokenScript.getMetadata().iconUrl.trim();
				} else {
					const originData = tokenScript.getTokenOriginData()[0];

					if (originData && CHAIN_MAP[originData.chainId]) {
						const discoveryAdapter = new DiscoveryAdapter();
						try {
							const data = await discoveryAdapter.getCollectionMeta(originData, CHAIN_MAP[originData.chainId]);
							meta.iconUrl = data.image;
						} catch (e) {
							console.error("Failed to load tokenscript icon from collection metadata", e);
						}
					}
				}
			}

			await this.addTokenScript(meta, tokenScript);

			await this.addDialog.closeDialog();
			this.app.hideTsLoader();

			this.viewerPopover.open(tokenScript);

			return {...meta, tokenScript};

		} catch (e){
			console.error(e);
			this.app.hideTsLoader();
			this.showToast.emit({
				type: "error",
				title: "Failed to load TokenScript",
				description: e.message
			});
		}
	}

	render(){
		return (
			<Host>
				<h3>Smart Token Viewer</h3>
				<p>Connect your wallet to use your TokenScript enabled tokens. <a
					onClick={() => this.aboutDialog.openDialog()}>Learn More</a>.</p>
				<div class="toolbar">
					<wallet-button></wallet-button>
					<button class="btn" onClick={() => {
						this.addDialog.openDialog();
					}}>+ Add Token
					</button>
				</div>
				<div style={{padding: "10px 0"}}>
					<div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
						<h4>Your Tokens</h4>
						<button class="btn" style={{marginRight: "5px", minWidth: "35px", fontSize: "16px"}}
						        onClick={() => {
							        for (const id in this.myTokenScripts) {
								        if (!this.myTokenScripts[id].tokenScript)
									        continue;
								        this.myTokenScripts[id].tokenScript.getTokenMetadata(true, true);
							        }
						        }}>↻
						</button>
					</div>
					{
						Object.values(this.myTokenScripts).length > 0 ?
							<tokenscript-grid showLoader={this.scriptsLoading}>
								{
									Object.values(this.myTokenScripts).map((ts) => {
										return (
											<tokenscript-button
												key={ts.tokenScriptId}
												tsId={ts.tokenScriptId}
												name={ts.name}
												imageUrl={ts.iconUrl}
												tokenScript={ts.tokenScript}
												onClick={() => {
													if (!ts.tokenScript) {
														this.showToast.emit({
															type: "error",
															title: "TokenScript not available",
															description: "This tokenscript could not be resolved"
														});
														return;
													}
													this.viewerPopover.open(ts.tokenScript);
												}}
												onRemove={async (tsId: string) => {
													this.removeTokenScript(tsId);
												}}>
											</tokenscript-button>
										);
									})
								}
							</tokenscript-grid> :
							(!this.scriptsLoading ? <div>
								<strong style={{fontSize: "13px"}}>You don't have any TokenScripts in your
									library yet</strong><br/>
								<span style={{fontSize: "12px"}}>Add TokenScripts by selecting popular ones below or adding them manually via the Add Tokens button.</span>
							</div> : '')

					}
				</div>
				{this.popularTokenscripts.length > 0 ?
					<div>
						<h4>Popular Smart Tokens</h4>
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
				<add-selector ref={el => this.addDialog = el as HTMLAddSelectorElement}
				              onFormSubmit={this.addFormSubmit.bind(this)}></add-selector>
				<viewer-popover ref={el => this.viewerPopover = el as HTMLViewerPopoverElement}></viewer-popover>
				<script-select-dialog ref={el => this.scriptSelectDialog = el as HTMLScriptSelectDialogElement}
								onScriptSelect={async (scriptInfo: ScriptInfo) => {
									await this.addFormSubmit("resolve", {tsId: scriptInfo.sourceId + "-" + scriptInfo.scriptId})
								}}></script-select-dialog>
				<popover-dialog ref={el => this.aboutDialog = el as HTMLPopoverDialogElement}>
					<about-tokenscript></about-tokenscript>
				</popover-dialog>
			</Host>
	);
	}

	}

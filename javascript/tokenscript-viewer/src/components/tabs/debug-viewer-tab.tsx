import {Component, Element, h, Prop, State, Watch} from "@stencil/core";
import {Components} from "../../components";
import {TokenScript} from "../../../../engine-js/src/TokenScript";
import {Card} from "../../../../engine-js/src/tokenScript/Card";
import {ViewBinding} from "../../integration/viewBinding";
import {IToken} from "../../../../engine-js/src/tokens/IToken";
import {INFTTokenDetail} from "../../../../engine-js/src/tokens/INFTTokenDetail";
import AppRoot = Components.AppRoot;


@Component({
	tag: 'debug-viewer-tab',
	styleUrl: 'debug-viewer-tab.css',
	shadow: false,
})
export class DebugViewerTab {

	@Element() host: HTMLElement;

	@Prop() app: AppRoot;
	@Prop() tabId: string;

	@Prop() tokenScript: TokenScript;

	@State()
	cards: Card[] = [];

	@State()
	currentCardIndex: number = 0;

	@State()
	currentCard: Card;

	currentTokens: {[key: string]: IToken};

	viewBinding: ViewBinding;

	@State()
	currentTokensFlat: ((IToken|INFTTokenDetail)&{contextId: string})[] = [];

	@Watch('tokenScript')
	async loadTs(){

		if (!this.viewBinding){
			this.viewBinding = new ViewBinding(this.host);
		}

		this.viewBinding.setTokenScript(this.tokenScript);
		this.tokenScript.setViewBinding(this.viewBinding);

		(this.host.querySelector(".cards-container") as HTMLDivElement).style.display = "block";

		this.populateCards();

		await this.populateTokens();

		this.loadView();
	}

	componentDidLoad() {
		if (this.tokenScript)
			this.loadTs();
	}

	setTokenContext(tokenRef: string){

		const refs = tokenRef.split("-");

		this.tokenScript.setCurrentTokenContext(refs[0], refs.length > 1 ? parseInt(refs[1]): null);

		console.log("Token context set");
	}

	setCard(index){
		this.currentCardIndex = parseInt(index);
		this.loadView();
	}

	populateCards(){
		this.cards = this.tokenScript.getCards();
	}

	async populateTokens(){

		this.currentTokens = await this.tokenScript.getTokenMetadata();

		this.currentTokensFlat = Object.keys(this.currentTokens).reduce((tokenArr, contractName) => {

			if (this.currentTokens[contractName].nftDetails){

				// NFTs
				const tokens = this.currentTokens[contractName].nftDetails.map((nft, index) => {
					return {...nft, contextId: contractName + "-" + index};
				});
				tokenArr.push(...tokens);
			} else {
				// fungible token with balance
				const flatToken = {...this.currentTokens[contractName], contextId: contractName};
				tokenArr.push(flatToken);
			}

			return tokenArr;

		}, []);

		if (this.currentTokensFlat.length > 0){
			await this.setTokenContext(this.currentTokensFlat[0].contextId);
		}
	}

	loadView(){

		if (this.cards.length === 0)
			return;

		(this.host.querySelector(".view-container") as HTMLDivElement).style.display = "block";

		const currentCard = this.cards[this.currentCardIndex];

		this.tokenScript.showTokenCard(currentCard);
	}

	render() {
		return (
			<div>
				<div class="cards-container" style={{display: "none"}}>
					<h5>Select Action</h5>
					<select class="card-select" onChange={(e) => this.setCard((e.target as HTMLSelectElement).value) }>
						{ this.cards ? this.cards.map((card, i) => {
							return (<option value={i} selected={i === this.currentCardIndex}>{card.label}</option>);
						}) : ''}
					</select>

					<h5>Select Token Context</h5>
					<select class="token-select" onChange={ (e) => this.setTokenContext((e.target as HTMLSelectElement).value)}>
						{
							this.currentTokensFlat ? this.currentTokensFlat.map((token, index) => {
								return (
									<option value={ token.contextId } >
										{ token.name + ' (' + ("tokenId" in token ? token.collectionDetails.id + ' #' + token.tokenId : token.name) + ')' }
									</option>
								);
							}) : ''
						}
					</select>
				</div>
				<div class="view-container" style={{display: "none"}}>
					<div class="view-loader" style={{display: "none"}}>
						<loading-spinner/>
					</div>
					<iframe class="tokenscript-frame"
							sandbox="allow-scripts allow-modals allow-forms">
					</iframe>
					<div class="action-bar" style={{display: "none"}}>
						<button class="action-btn"></button>
					</div>
				</div>
				<div>
					<security-status tokenScript={this.tokenScript}/>
					<table class="attribute-table"></table>
				</div>
			</div>
		);
	}
}

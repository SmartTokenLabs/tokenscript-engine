import {Component, h, Prop, State} from "@stencil/core";
import {AppRoot} from "../../app/app";
import {Web3WalletProvider} from "../../wallet/Web3WalletProvider";

@Component({
	tag: 'new-viewer',
	styleUrl: 'new-viewer.css',
	shadow: false,
	scoped: false
})
export class NewViewer {

	@Prop()
	app: AppRoot;

	private dialog: HTMLPopoverDialogElement;

	componentWillLoad(){

	}

	render(){
		return (
			<div class="nv-container">
				<h3>TokenScript Viewer</h3>
				<p>Connect your wallet to use your TokenScript enabled tokens</p>
				<div class="toolbar">
					<button class="btn btn-secondary" onClick={() => {
						this.dialog.openDialog();
					}}>+ Add Token
					</button>
					<wallet-button></wallet-button>
				</div>
				<div>
					<h5>Your Tokens</h5>
					<br/><br/>
				</div>
				<div>
					<h5>Popular TokenScripts</h5>
					<br/>
					<div style={{display: "flex"}}>
						<tokenscript-button
							name={"ENS"}
							imageUrl={"https://464911102-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/collections%2F2TjMAeHSzwlQgcOdL48E%2Ficon%2FKWP0gk2C6bdRPliWIA6o%2Fens%20transparent%20background.png?alt=media&token=bd28b063-5a75-4971-890c-97becea09076"}
							subText={"2 Tokens"}>
						</tokenscript-button>
					</div>
				</div>
				<popover-dialog ref={el => this.dialog = el as HTMLPopoverDialogElement}>
					<h3>Test Dialog Content</h3>
				</popover-dialog>
			</div>
		);
	}

}

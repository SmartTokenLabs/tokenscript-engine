import {Component, Event, EventEmitter, h, Method, Prop, State} from "@stencil/core";
import {TokenScriptEngine} from "../../../../../engine-js/src/Engine";
import {ITokenDetail} from "../../../../../engine-js/src/tokens/ITokenDetail";
import {ITransactionStatus} from "../../../../../engine-js/src/TokenScript";
import {handleTransactionError, showTransactionNotification} from "../util/showTransactionNotification";
import {ShowToastEventArgs} from "../../app/app";

@Component({
	tag: 'transfer-dialog',
	styleUrl: 'transfer-dialog.css',
	shadow: false,
	scoped: false
})
export class TransferDialog {

	private dialog: HTMLPopoverDialogElement;

	@Prop()
	engine: TokenScriptEngine;

	@Prop()
	tokenDetails: ITokenDetail;

	@State()
	recipient: string = "";

	@State()
	amount: number = 1;

	@Event({
		eventName: 'showToast',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) showToast: EventEmitter<ShowToastEventArgs>;

	@Event({
		eventName: 'showLoader',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) showLoader: EventEmitter<void>;

	@Event({
		eventName: 'hideLoader',
		composed: true,
		cancelable: true,
		bubbles: true,
	}) hideLoader: EventEmitter<void>;

	@Method()
	async openDialog(){
		await this.dialog.openDialog();
	}

	@Method()
	async closeDialog(){
		await this.dialog.closeDialog();
	}

	private async transferToken(){

		const walletProvider = await this.engine.getWalletAdapter()

		const method = "safeTransferFrom";

		const args = [
			{
				name: "from",
				type: "address",
				value: await walletProvider.getCurrentWalletAddress(), // TODO: Use address provided via URL
			},
			{
				name: "to",
				type: "address",
				value: this.recipient
			},
			{
				name: "tokenId",
				type: "uint256",
				value: BigInt(this.tokenDetails.tokenId)
			}
		];

		if (this.tokenDetails.collectionDetails.tokenType === "erc1155"){
			args.push(
				{
					name: "amount",
					type: "uint256",
					value: BigInt(this.amount)
				},
				{
					name: "data",
					type: "bytes",
					value: "0x00"
				},
			);
		}

		this.showLoader.emit();

		try {
			await walletProvider.sendTransaction(
				this.tokenDetails.collectionDetails.chainId,
				this.tokenDetails.collectionDetails.contractAddress,
				method,
				args,
				null,
				true,
				async (data: ITransactionStatus) => {

					if (data.status === "confirmed")
						this.hideLoader.emit();

					await showTransactionNotification(data, this.showToast);
				}
			)
		} catch(e){
			console.error(e);
			this.hideLoader.emit();
			handleTransactionError(e, this.showToast);
			return;
		}

		this.closeDialog();
	}

	render(){
		return (
			<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement} dialogStyles={{maxWidth: "400px"}}>
				<form class="transfer-form" onSubmit={(e) => { e.preventDefault(); this.transferToken(); }}>
					<div>
						<h3>Send</h3>
						<div class="form-field">
							<label>Send to</label>
							<input type="text" value={this.recipient} placeholder="Ethereum address"
								   onChange={(evt) => this.recipient = (evt.target as HTMLInputElement).value} required />
						</div>
						{this.tokenDetails.collectionDetails.tokenType === "erc1155" ?
							<div class="form-field">
								<label>Amount</label>
								<input type="number" value={this.amount} placeholder="Amount"
									   onChange={(evt) => this.amount = parseInt((evt.target as HTMLInputElement).value)}
									   required />
							</div> : ''
						}
					</div>
					<button type="submit" class="jid-btn jid-transfer-btn">Send</button>
				</form>
			</popover-dialog>
		)
	}
}

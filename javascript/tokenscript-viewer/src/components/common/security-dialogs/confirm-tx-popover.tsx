import {Component, h, Method, State} from "@stencil/core";
import {ITxValidationInfo} from "../../../../../engine-js/src/security/TransactionValidator";
import {CHAIN_MAP, CHAIN_NAME_MAP} from "../../../integration/constants";

@Component({
	tag: 'confirm-tx-popover',
	styleUrl: 'confirm-tx-popover.css',
	shadow: false,
	scoped: false
})
export class ConfirmTxPopover {

	private dialog: HTMLPopoverDialogElement;

	private callBack;

	@State()
	private txInfo: ITxValidationInfo;

	@Method()
	async confirmTransaction(txInfo: ITxValidationInfo){
		this.txInfo = txInfo;
		await this.dialog.openDialog(() => this.callBack(false));
		return new Promise<boolean>((resolve, reject) => {
			this.callBack = resolve;
		});
	}

	private confirm(result: boolean){
		this.callBack(result);
		this.dialog.closeDialog();
	}

	render(){
		return (
			<popover-dialog ref={(el) => this.dialog = el as HTMLPopoverDialogElement} dialogStyles={{maxWidth: "380px"}}>
				{this.txInfo ?
					(
						<div class="tx-confirm-dialog">
							<div class="tx-confirm-info">
								<div class="tx-confirm-header">
									<img alt="caution" src="/assets/icon/caution.svg" />
									<h1> Caution!</h1>
								</div>
								<p>
									This token is trying to send a transaction to a contract that it is not signed for.
									Please proceed with caution.
								</p>
								<strong>Chain: </strong><br/><span>{CHAIN_NAME_MAP[this.txInfo.chain]} (ID {this.txInfo.chain})</span><br/>
								<strong>Contract: </strong><br/><span>{this.txInfo.toAddress}</span>
							</div>
							<div class="tx-confirm-buttons">
								<button class="btn btn-primary" onClick={() => this.confirm(true)}>I understand the
									risks
								</button>
								<button class="btn btn-primary" onClick={() => this.confirm(false)}>Abort</button>
							</div>
						</div>
					) : ''
				}
			</popover-dialog>
		)
	}
}

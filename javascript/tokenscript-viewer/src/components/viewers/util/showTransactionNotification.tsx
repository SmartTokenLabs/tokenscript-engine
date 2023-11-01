import {ITransactionStatus} from "@tokenscript/engine-js/src/TokenScript";
import {EventEmitter, h} from "@stencil/core";
import {ShowToastEventArgs} from "../../app/app";


export const showTransactionNotification = async (data: ITransactionStatus, showToast: EventEmitter<ShowToastEventArgs>) => {

	switch (data.status){
		case "submitted":
			await showToast.emit({
				type: 'info',
				title: "Transaction submitted",
				description: (<span>
						{"Processing TX, please wait.. "}<br/>
					{"TX Number: " + data.txNumber}
					</span>)
			});
			break;
		case "confirmed":
			await showToast.emit({
				type: 'success',
				title: "Transaction confirmed",
				description: (<span>
						{"TX " + data.txNumber + " confirmed!"}<br/>{
						data.txLink ? <a href={data.txLink} target="_blank">{"View On Block Scanner"}</a> : ''}
							</span>)
			});
			break;
	}

};

export const handleTransactionError = (e: any, showToast: EventEmitter<ShowToastEventArgs>) => {

	let message = e.message;

	const revertMatch = message.match(/reverted with reason string '(.*)'/);

	if (revertMatch)
		message = revertMatch[1];

	showToast.emit({
		type: 'error',
		title: "Transaction Error",
		description: message
	});
};

import {ITransactionStatus} from "@tokenscript/engine-js/src/TokenScript";
import {EventEmitter, h} from "@stencil/core";
import {ShowToastEventArgs} from "../../app/app";
import de from "@walletconnect/qrcode-modal/dist/cjs/browser/languages/de";


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

	if (revertMatch){
		message = revertMatch[1];
	} else {
		const regex = /"message": "(.*)"/g;
		let match;
		const detailedMessages = [];

		while (match = regex.exec(message)){
			if (detailedMessages.indexOf(match[1]) === -1)
				detailedMessages.push(match[1]);
		}

		if (detailedMessages.length)
			message = detailedMessages.join("\n");
	}

	showToast.emit({
		type: 'error',
		title: "Transaction Error",
		description: message
	});
};

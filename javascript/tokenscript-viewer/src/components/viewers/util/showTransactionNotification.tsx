import {ITransactionStatus} from "@tokenscript/engine-js/src/ITokenScript";
import {EventEmitter, h} from "@stencil/core";
import {ShowToastEventArgs} from "../../app/app";


export const showTransactionNotification = async (data: ITransactionStatus, showToast: EventEmitter<ShowToastEventArgs>) => {

	switch (data.status){
		case "submitted":
			showToast.emit({
				type: 'info',
				title: "Transaction submitted",
				description: (<span>
					{"Processing TX, please wait.. "}<br/>
					<small>{"TX Number: " + data.txNumber}</small><br/>
					{data.txLink ? <a href={data.txLink} target="_blank">View On Block Scanner</a> : ''}
				</span>)
			});
			break;
		case "confirmed":
			showToast.emit({
				type: 'success',
				title: "Transaction confirmed",
				description: (<span>
					<small>{"TX " + data.txNumber + " confirmed!"}</small><br/>
					{data.txLink ? <a href={data.txLink} target="_blank">View On Block Scanner</a> : ''}
				</span>)
			});
			if (window.gtag) {
				window.gtag('event', 'tx_confirmed', {
					'tx_hash': data.txNumber
				});
			}
			break;
	}

};

export const handleTransactionError = (e: any, showToast: EventEmitter<ShowToastEventArgs>) => {

	console.error(e);

	let message = e.message;

	const revertMatch = message.match(/reverted with reason string '(.*)'/);

	if (revertMatch){
		message = revertMatch[1];
	} else {
		const revertMatch = message.match(/Details: (.*)\\n/);

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
	}

	showToast.emit({
		type: 'error',
		title: "Transaction Error",
		description: (
			<div>
				<p>{message}</p>
				<button style={{
							border: "2px solid #EF4444",
							background: "#fff",
							color: "#EF4444",
							padding: "4px 8px 4px 0",
							marginTop: "5px",
							borderRadius: "5px",
							fontWeight: "500"
						}}
				        onClick={() => navigator.clipboard.writeText(e.message)}>
					<copy-icon style={{paddingLeft: "0 !important"}} height={"20px"} copyText={e.message}/>
					Copy Error
				</button>
			</div>
		)
	});
};

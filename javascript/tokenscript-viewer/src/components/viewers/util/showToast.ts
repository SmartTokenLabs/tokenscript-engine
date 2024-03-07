import {JSX} from "@stencil/core";

export async function showToastNotification(type: 'success'|'info'|'warning'|'error', title: string, description: string|JSX.Element){

	const cbToast = document.querySelector(".toast") as HTMLCbToastElement;

	await cbToast.Toast({
		title,
		description: description ?? "-",
		timeOut: 30000,
		position: 'top-right',
		type
	});
}

// @ts-ignore
window.showToastNotification = showToastNotification;

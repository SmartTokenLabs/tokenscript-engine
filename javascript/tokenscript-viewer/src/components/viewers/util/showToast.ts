import {JSX} from "@stencil/core";

export async function showToastNotification(type: 'success'|'info'|'warning'|'error', title: string, description: string|JSX.Element, position: "top"|"top-right" = "top-right"){

	const cbToast = document.querySelector(".toast") as HTMLCbToastElement;

	await cbToast.Toast({
		title,
		description: description ?? "-",
		timeOut: 30000,
		position,
		type
	});
}

// @ts-ignore
window.showToastNotification = showToastNotification;

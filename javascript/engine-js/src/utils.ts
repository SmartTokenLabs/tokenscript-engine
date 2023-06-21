
export function pemOrBase64Orbase64urlToString(base64str: string): string {
	let base64StrArray = base64str.split(/\r?\n/);

	// maybe remove empty lines at the end of file
	while ( base64StrArray[base64StrArray.length - 1].trim() === "" ) {
		base64StrArray.pop();
	}

	// maybe remove first and last line and concat lines
	if (base64str.slice(0,3) === "---") {
		base64StrArray.shift();
		base64StrArray.pop();
	}
	base64str = base64StrArray.join('');

	// maybe change base64url to base64
	base64str = base64str.split('_').join('/')
		.split('-').join('+')
		.split('.').join('=');

	return base64str;
}

/*
Convert pem/base64/base64url to Uint8Array
 */
export function base64ToUint8array( base64str: string ): Uint8Array {

	base64str = pemOrBase64Orbase64urlToString(base64str);

	let res: Uint8Array;

	if (typeof window === 'undefined' || !window.atob) {
		res = Uint8Array.from(Buffer.from(base64str, 'base64'));
	} else {
		res = Uint8Array.from(window.atob(base64str), c => c.charCodeAt(0));
	}

	return res;
}

export function uint8toString(uint8: Uint8Array): string {
	if (!uint8) return '';
	let binary = '';
	let len = uint8.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode( uint8[ i ] );
	}
	return binary;
}

export function uint8arrayToBase64( bytes: Uint8Array ): string {

	if (typeof window === 'undefined' || !window.btoa) {
		let buff = Buffer.from(bytes);
		return buff.toString('base64');
	} else {
		let binary = uint8toString(bytes);
		return window.btoa( binary );
	}

}

const TG_URL = 'https://t.me/SmartLayerBot/SmartTokenViewer/';

export function getTgUrl() {
	const query = window.location.href.split('?')[1]
	if (query) {
		const decodedQueryString = decodeURIComponent(query);
		const base64Encoded = btoa(decodedQueryString)
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');;
		return `${TG_URL}?startapp=${base64Encoded}`;
	} else {
		return TG_URL
	}
}


export function decodeSafeBase64QueryString(encodedString: string) {
  try {
    let base64 = encodedString.replace(/-/g, '+').replace(/_/g, '/');

    while (base64.length % 4) {
      base64 += '=';
    }

    const decodedQuery = atob(base64);

    return decodedQuery;
  } catch (error) {
    console.error('Error decoding Base64 string:', error);
    return null;
  }
}


import { Component, h, Prop } from '@stencil/core';

const X_POST_URL = "https://x.com/intent/tweet";

function buildTlinkToShareOnTwitter() {
	const url = new URL(document.location.href);
	// change host to tlink.store/tapp
	const newUrl = new URL('tapp', 'https://tlink.store');

	url.searchParams.forEach((value, key) => {
		newUrl.searchParams.set(key, value);
	});

	// add tokenId to the new url
	const tokenIdMatch = url.hash.match(/tokenId=([^&]+)/);
	if (tokenIdMatch) {
		newUrl.searchParams.set('tokenId', tokenIdMatch[1]);
	}

	newUrl.hash = url.hash;

	return newUrl.toString();
}

function getXPostUrl(){
	return `${X_POST_URL}?text=${encodeURIComponent(buildTlinkToShareOnTwitter()) + ' #SmartLayer #Tapps'}&related=SmartLayer`;
}

@Component({
  tag: 'share-to-x-button',
  shadow: false,
})
export class XShareButton {
  @Prop() style?: { [key: string]: string };

  render() {
    return (
      <div>
        <a
          href={getXPostUrl()}
          target="_blank"
          class=""
          style={{ display: 'block', marginRight: '5px', width: '36px', height: '36px', fontSize: '16px', ...this.style }}
          title="Share on Telegram"
        >
          <img alt="Share to X.com" title="Share to X.com"
               src="/assets/icon/x-icon.png" style={{ width: '100%', height: '100%', borderRadius: '9999px' }} />
        </a>
      </div>
    );
  }
}

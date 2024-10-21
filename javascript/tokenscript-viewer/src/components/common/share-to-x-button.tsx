import { Component, h, Prop } from '@stencil/core';
import { getTgUrl } from '../viewers/util/tgUrl';

const X_POST_URL = "https://x.com/intent/tweet";

function getXPostUrl(){
	return `${X_POST_URL}?text=${encodeURIComponent(document.location.href)+ " #SmartLayer #Tapps"}&related=SmartLayer`;
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
               src="/assets/icon/x-icon.png" style={{ width: '100%', height: '100%' }} />
        </a>
      </div>
    );
  }
}

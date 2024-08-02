import { Component, h, Prop } from '@stencil/core';
import { getTgUrl } from '../viewers/util/tgUrl';

@Component({
  tag: 'share-to-tg-button',
  shadow: true,
})
export class TelegramShareButton {
  @Prop() style?: { [key: string]: string };

  render() {
    return (
      <div>
        <a
          href={getTgUrl()}
          target="_blank"
          class=""
          style={{ display: 'block', marginRight: '5px', width: '36px', height: '36px', fontSize: '16px', ...this.style }}
          title="Share on Telegram"
        >
          <img src="https://cdn3.iconfinder.com/data/icons/social-icons-33/512/Telegram-1024.png" style={{ width: '100%', height: '100%' }} />
        </a>
      </div>
    );
  }
}

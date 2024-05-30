import { Component, h, Host, Prop, State } from '@stencil/core';

@Component({
  tag: 'copy-icon',
  styleUrl: 'copy-icon.css',
  shadow: false,
  scoped: false,
})
export class CopyIcon {
  @Prop()
  copyText: string;

  @Prop()
  height: string = '18px';

  @State()
  clipboardAvailable: boolean = !!navigator.clipboard;

  @State()
  sameOrigin: boolean = false;

  componentWillLoad() {
    const parentOrigin = new URL(document.referrer).origin;
    const iframeOrigin = window.location.origin;
    this.sameOrigin = parentOrigin === iframeOrigin;
  }

  copy() {
    if (this.clipboardAvailable) {
      navigator.clipboard.writeText(this.copyText);
    }
  }

  render() {
    return (
      <Host style={{ height: this.height }}>
        {this.clipboardAvailable && this.sameOrigin && (
          <img
            class="copy-icon"
            alt="copy"
            title="Copy"
            src="/assets/icon/copy.svg"
            onClick={() => this.copy()}
          />
        )}
      </Host>
    );
  }
}

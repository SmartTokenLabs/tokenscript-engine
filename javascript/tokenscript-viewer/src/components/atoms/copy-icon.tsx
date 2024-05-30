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

	copy() {
		if (this.clipboardAvailable) {
			navigator.clipboard.writeText(this.copyText);
		}
	}

	render() {
		return (
			<Host style={{ height: this.height }}>
				{this.clipboardAvailable && <img class="copy-icon" alt="copy" title="Copy" src="/assets/icon/copy.svg" onClick={() => this.copy()} />}
			</Host>
		);
	}
}

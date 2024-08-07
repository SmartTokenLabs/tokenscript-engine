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
			<Host style={{ height: this.height, display: "inline-block" }}>
				{this.clipboardAvailable &&
					<svg fill="currentColor" class="copy-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" onClick={() => this.copy()}>
						<path d="M21,8.94a1.31,1.31,0,0,0-.06-.27l0-.09a1.07,1.07,0,0,0-.19-.28h0l-6-6h0a1.07,1.07,0,0,0-.28-.19.32.32,0,0,0-.09,0A.88.88,0,0,0,14.05,2H10A3,3,0,0,0,7,5V6H6A3,3,0,0,0,3,9V19a3,3,0,0,0,3,3h8a3,3,0,0,0,3-3V18h1a3,3,0,0,0,3-3V9S21,9,21,8.94ZM15,5.41,17.59,8H16a1,1,0,0,1-1-1ZM15,19a1,1,0,0,1-1,1H6a1,1,0,0,1-1-1V9A1,1,0,0,1,6,8H7v7a3,3,0,0,0,3,3h5Zm4-4a1,1,0,0,1-1,1H10a1,1,0,0,1-1-1V5a1,1,0,0,1,1-1h3V7a3,3,0,0,0,3,3h3Z"/>
					</svg>
				}
			</Host>
		);
	}
}

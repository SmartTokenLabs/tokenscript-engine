import {Component, h, Host, Prop} from "@stencil/core";

@Component({
	tag: 'copy-icon',
	styleUrl: 'copy-icon.css',
	shadow: false,
	scoped: false
})
export class CopyIcon {

	@Prop()
	copyText: string;

	@Prop()
	height: string = "18px";

	copy(){
		navigator.clipboard.writeText(this.copyText);
	}

	render(){
		return (
			<Host style={{height: this.height}}>
				<img class="copy-icon" alt="copy" title="Copy"
				     src="/assets/icon/copy.svg" onClick={() => this.copy()}/>
			</Host>
		);
	}
}

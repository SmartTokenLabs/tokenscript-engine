import {Component, h, Host, Prop} from "@stencil/core";

@Component({
	tag: 'tokenscript-grid',
	styleUrl: 'tokenscript-grid.css',
	shadow: false,
	scoped: false
})
export class TokenscriptGrid {

	@Prop()
	showLoader = false;

	render(){
		return (
			<Host class="ts-grid">
				<slot/>
				{ this.showLoader ? <div class="loader-container"><loading-spinner color="#1A42FF" size="small"></loading-spinner></div> : '' }
			</Host>
		);
	}
}

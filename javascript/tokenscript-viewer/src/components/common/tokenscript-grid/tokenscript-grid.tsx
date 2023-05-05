import {Component, h, Host} from "@stencil/core";

@Component({
	tag: 'tokenscript-grid',
	styleUrl: 'tokenscript-grid.css',
	shadow: false,
	scoped: false
})
export class TokenscriptGrid {

	render(){
		return (
			<Host class="ts-grid">
				<slot/>
			</Host>
		);
	}
}

import {Component, h, Prop} from "@stencil/core";

@Component({
	tag: 'tokenscript-grid',
	styleUrl: 'tokenscript-grid.css',
	shadow: false,
	scoped: false
})
export class TokenscriptGrid {

	render(){
		return (
			<div class="ts-grid">
				<slot/>
			</div>
		);
	}
}

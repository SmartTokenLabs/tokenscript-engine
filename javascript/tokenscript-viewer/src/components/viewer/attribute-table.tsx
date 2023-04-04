import {Component, h, State} from "@stencil/core";

@Component({
	tag: 'attribute-table',
	styleUrl: 'attribute-table.css',
	shadow: false,
	scoped: false
})
export class AttributeTable {

	@State()
	private isOpen = false;

	render() {
		return (
			<div class="attribute-widget">
				<div class="attribute-container" style={{display: (this.isOpen ? "block" : "none")}}>
					<table class="attribute-table"></table>
					<button class="close-btn btn-close-attributes"
							title="Close attributes"
							onClick={() => { this.isOpen = false }}>X</button>
				</div>
				<button class="close-btn"
						style={{display: (this.isOpen ? "none" : "block")}}
						title="View TokenScript attributes"
						onClick={() => { this.isOpen = true }}>?</button>
			</div>
		);
	}
}

import {Component, h} from "@stencil/core";

@Component({
	tag: 'card-view',
	styleUrl: 'card-view.css',
	shadow: false,
	scoped: false
})
export class CardView {

	render(){
		return (
			<div class="card-container">
				<div class="iframe-wrapper">
					<div class="view-loader" style={{display: "none"}}>
						<loading-spinner/>
					</div>
					<iframe class="tokenscript-frame"
					        allow="clipboard-write"
					        frameborder="0"
							sandbox="allow-scripts allow-modals allow-forms allow-popups allow-popups-to-escape-sandbox">
					</iframe>
				</div>
				<div class="action-bar" style={{display: "none"}}>
					<button class="action-btn btn btn-primary"></button>
				</div>
			</div>
		)
	}
}

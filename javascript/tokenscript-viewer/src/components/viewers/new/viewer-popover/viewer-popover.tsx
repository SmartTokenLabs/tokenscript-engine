import {Component, h, State, Element, Method, Host} from "@stencil/core";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";


@Component({
	tag: 'viewer-popover',
	styleUrl: 'viewer-popover.css',
	shadow: false,
	scoped: false
})
export class ViewerPopover {

	@Element()
	host;

	@State()
	tokenScript?: TokenScript;

	@Method()
	async open(tokenScript: TokenScript){
		this.tokenScript = tokenScript;
	}

	@Method()
	async close(){
		this.tokenScript = null;
	}

	render(){
		return ( this.tokenScript ?
			<Host class={(this.tokenScript ? " open" : "")}>
				<div class="toolbar">
					<div class="view-heading">
						<button class="btn" onClick={() => this.close()}>&lt;</button>
						<h3>{this.tokenScript.getLabel() ?? this.tokenScript.getName()}</h3>
					</div>
					<div class="view-toolbar-buttons">
						<security-status tokenScript={this.tokenScript}/>
						<div>
							<button class="btn" style={{marginRight: "5px", minWidth: "35px", fontSize: "16px"}}
									onClick={() => this.tokenScript.getTokenMetadata(true, true)}>↻
							</button>
							<wallet-button></wallet-button>
						</div>
					</div>
				</div>
				<tokens-grid tokenScript={this.tokenScript}></tokens-grid>
				<card-modal tokenScript={this.tokenScript}></card-modal>
			</Host> : ''
		)
	}
}

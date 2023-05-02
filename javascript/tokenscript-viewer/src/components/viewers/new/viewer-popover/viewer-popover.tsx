import {Component, h, JSX, State, Element, Method, Host} from "@stencil/core";
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

	showToast(type: 'success'|'info'|'warning'|'error', title: string, description: string|JSX.Element){

		const cbToast = this.host.querySelector(".toast") as HTMLCbToastElement;

		cbToast.Toast({
			title,
			description,
			timeOut: 30000,
			position: 'top-right',
			type
		});
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
						<button class="btn" style={{marginRight: "5px", minWidth: "35px", fontSize: "16px"}}
								onClick={() => this.tokenScript.getTokenMetadata(true, true)}>↻
						</button>
						<wallet-button></wallet-button>
					</div>
				</div>
				<tokens-grid tokenScript={this.tokenScript} showToast={this.showToast.bind(this)}></tokens-grid>
				<card-modal tokenScript={this.tokenScript}></card-modal>
				<cb-toast class="toast"></cb-toast>
			</Host> : ''
		)
	}
}

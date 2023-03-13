import {Component, h, Prop, Element} from "@stencil/core";
import {Components} from "../../components";
import AppRoot = Components.AppRoot;

@Component({
	tag: 'tab-header-item',
	styleUrl: 'tab-header-item.css',
	shadow: true,
})
export class StartTab {

	@Prop() app: AppRoot;
	@Prop() tabId: string;
	@Prop() tabTitle: string;
	@Prop() closable = true;

	render() {
		return (
			<div class="tab-button" onClick={() => this.app.showTab(this.tabId) } title={this.tabTitle}>
				<span>{this.tabTitle}</span>
				{this.closable === true ? <button onClick={() => this.app.closeTab(this.tabId) }>X</button> : ''}
			</div>
		);
	}
}

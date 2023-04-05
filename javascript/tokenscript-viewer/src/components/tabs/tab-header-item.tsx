import {Component, h, Prop} from "@stencil/core";
import {TabbedViewer} from "../viewers/tabbed/tabbed-viewer";

@Component({
	tag: 'tab-header-item',
	styleUrl: 'tab-header-item.css',
	shadow: true,
})
export class StartTab {

	@Prop() tabView: TabbedViewer;
	@Prop() tabId: string;
	@Prop() tabTitle: string;
	@Prop() closable = true;

	render() {
		return (
			<div class="tab-button" onClick={() => this.tabView.showTab(this.tabId) } title={this.tabTitle}>
				<span>{this.tabTitle}</span>
				{this.closable === true ? <button onClick={() => this.tabView.closeTab(this.tabId) }>X</button> : ''}
			</div>
		);
	}
}

import {Component, Prop, h, State} from "@stencil/core";
import {IntegrationViewer} from "../integration-viewer";
import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";

@Component({
	tag: 'select-step',
	// styleUrl: 'tabbed-viewer.css',
	shadow: false,
	scoped: false
})
export class SelectStep {

	@Prop()
	viewer: IntegrationViewer

	@Prop()
	tokenScript: TokenScript

	@State()
	securityInfo;

	async componentWillLoad() {
	}

	render() {
		return ('');
	}
}

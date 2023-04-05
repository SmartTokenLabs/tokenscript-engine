import {Component, h, Prop} from "@stencil/core";
import {AppRoot} from "../../app/app";

@Component({
	tag: 'integration-viewer',
	// styleUrl: 'tabbed-viewer.css',
	shadow: false,
	scoped: false
})
export class IntegrationViewer {

	@Prop()
	app: AppRoot;

	render(){
		return(
			<h3>Hello integration view</h3>
		);
	}

}

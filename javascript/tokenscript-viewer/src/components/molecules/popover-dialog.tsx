import {Component, h, Method, Prop, State} from "@stencil/core";

@Component({
	tag: 'popover-dialog',
	styleUrl: 'popover-dialog.css',
	shadow: false,
	scoped: false
})
export class PopoverDialog {

	@State()
	open: boolean = false;

	@Prop()
	dialogStyles: {[cssProp: string]: string} = {};

	private dismissCallback: () => void|Promise<void>

	@Method()
	async openDialog(dismissCallback?: () => void|Promise<void>){
		this.open = true;
		this.dismissCallback = dismissCallback;
	}

	@Method()
	async closeDialog(){
		this.open = false;
	}

	render(){
		return (
			<div class={"popover-modal" + (this.open ? ' open' : '')}>
				<div class="popover-container" style={this.dialogStyles}>
					<button class="close-btn" onClick={() => {
						this.open = false;
						if (this.dismissCallback) {
							this.dismissCallback();
							this.dismissCallback = null;
						}
					}}>x</button>
					<div class="popover-inner">
						<slot/>
					</div>
				</div>
			</div>
		);
	}
}

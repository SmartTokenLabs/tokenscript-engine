import {Component, h, Host} from "@stencil/core";


@Component({
	tag: 'about-tokenscript',
	//styleUrl: 'about-tokenscript.css',
	shadow: false,
	scoped: false
})
export class AttributeTable {

	render(){
		return (
			<Host>
				<h2>Welcome to TokenScript Viewer</h2>
				<p>
					TokenScript Viewer is an easy way to run TokenScripts in your browser if you don't have a TokenScript compatible wallet.<br/>
					If you want to try TokenScripts in your wallet, you can download <a href="https://alphawallet.com/" target="_blank">AlphaWallet</a> for Android and iOS.
				</p>
				<h3>What is TokenScript?</h3>
				<p>
					TokenScript is a framework for providing rich, embedded & secure token utility for blockchain & attestation tokens.<br/>
					Simply put, it's a new way of writing DApps which provides UX & security benefits for users by cryptographically tying the frontend to the smart contract or attestation issuer.<br/>
				</p>
				<p>
					For more information please visit <a href="https://www.tokenscript.org/" target="_blank">https://www.tokenscript.org/</a>
				</p>
			</Host>
		)
	}
}

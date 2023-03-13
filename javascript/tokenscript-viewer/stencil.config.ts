import {Config} from '@stencil/core';
//import nodePolyfills from "rollup-plugin-polyfill-node";
//import builtins from 'rollup-plugin-node-builtins';
//import globals from 'rollup-plugin-node-globals';
import nodePolyfills from "rollup-plugin-node-polyfills";

// https://stenciljs.com/docs/config

export const config: Config = {
	globalStyle: 'src/global/app.css',
	globalScript: 'src/global/app.ts',
	taskQueue: 'async',
	outputTargets: [
		{
			type: 'www',
			// comment the following line to disable service workers in production
			serviceWorker: null,
			baseUrl: 'https://myapp.local/',
			polyfills: false
		},
	],
	nodeResolve: {
		module: true,
		browser: true,
		jsnext: true,
		main: true,
		preferBuiltins: false,
	},
	rollupPlugins: {
		after: [
			// TODO: these may be required for attestation library.
			//  They have been commented since Torus & WalletConnect modules are now imported as UMD which fixes polyfill issues
			//globals(),
			//builtins(),
			nodePolyfills({
				exclude: "buffer"
			})
		]
	},
	sourceMap: true
};

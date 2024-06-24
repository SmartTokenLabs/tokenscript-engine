
# TokenScript Card SDK

The TokenScript card SDK is bundled with the TokenScript engine and is injected into each cards iframe or webview along 
with the TokenScript userspace code.

### The SDK:
- Provides data from the view to the engine
- Provides methods for TokenScript cards to interact with the engine or user-agent
- Bundles commonly used libraries, so they don't have to be included in each TokenScript
- Provides tokenscript.d.ts, so that TokenScript developers can get type hinting & autocomplete for SDK methods

## Installation

To include SDK type in your TokenScript project, install the SDK as a developer dependency:

```
npm i -D @tokenscript/card-sdk
```

Then include the tokenscript.d.ts in the entrypoint of your application (e.g. index.ts/main.ts):

```
import "@tokenscript/card-sdk/src/tokenscript.d.ts";
```
OR
```
///<reference path="../node_modules/@tokenscript/card-sdk/src/tokenscript.d.ts""/>
```

## Bundled libraries

- ### ethers.js (version ^6.9)

## Bundling the SDK

To build & bundle an updated SDK with the engine:
`npm run bundle`
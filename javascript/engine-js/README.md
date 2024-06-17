
# TokenScript Engine

engine-js is a Typescript implementation of the TokenScript runtime.
It provides core functionality for resolving, parsing & running TokenScript applications and is the reference implementation
used to develop new features for the standard.

The engine is designed as a headless runtime that relies on user-agent interfaces for features such as wallet access
and TokenScript card presentations.

In this way the engine is suitable to be used in the browser and server, and can also be integrated as a webview component into native applications.

To demonstrate how to integrate the engine, we provide our reference frontend [TokenScript Viewer](../tokenscript-viewer)

## Installation

``
npm i @tokenscript/engine-js
``

## User Agent Interfaces

The engine provides a number of interfaces that can be implemented to provide functionality to the engine.

### Engine level interfaces
- [IWalletAdapter](./src/wallet/IWalletAdapter.ts) - provides ethereum wallet access through a set of standard interfaces.
	[EthersAdapter](./src/wallet/EthersAdapter.ts) is also included as a ready-to-use option when using an ethers.js signer.
- [ITokenDiscoveryAdapter](./src/tokens/ITokenDiscoveryAdapter.ts)- this and it's associated token data interfaces provide token discovery and metadata access. 
	Alternatively, the user-agent can push token details to the engine.
- [IAttestationStorageAdapter](./src/attestation/IAttestationStorageAdapter.ts) provides an interface to manage storage of attestation tokens. 
- [ILocalStorageAdapter](./src/view/data/ILocalStorageAdapter.ts) - Since cards are run in a sandboxed iframe from content extracted from the TSML/XML file, 
    they have no access to localStorage. This adapter allows cards to use a localStorage through a proxy provided by the engine and 
	a storage implementation provided by the user-agent.

### Instance level interfaces
- [IViewBinding](./src/view/IViewBinding.ts) - Possibly the most important interface for user interaction, it provides the glue between the UI and engine
	and is used to display TokenScript action cards. 

## Card SDK

The [Card SDK](../card-sdk) is built as a separate module and bundled with the engine
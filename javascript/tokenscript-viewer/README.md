
# TokenScript Viewer

The TokenScript Viewer is the example frontend for the TokenScript engine written with [Stencil.js](https://github.com/ionic-team/stencil).

As well as powering the [Smart Token Viewer](https://viewer.tokenscript.org/) and various other wallet & website integrations 
it is also used to emulate TokenScripts using the [TokenScript CLI](https://github.com/SmartTokenLabs/TokenScript-SDK).

## Engine interface implementations

Implementation of engine interfaces described [here](../engine-js) can be found in the following places: 

- [src/integration](src/integration)
- [src/components/common/card-view/card-popover.tsx](src/components/common/card-view/card-popover.tsx])

## Views

The TokenScript viewer provides a modular approach to UI, enabling the implementation of multiple "view types" for various scenarios. 
Here are some examples:

- New (default) - This is the default view and is essentially a DApp to interact with multiple TokenScript enabled tokens in one place.
- JoyID token - Is used to provide embedded TokenScript support for the Joy.id wallet. 
  It provides an NFT details screen with buttons to show TokenScript cards and actions.
- AlphaWallet - Provides an experimental embedded view for AlphaWallet Android.

# Tokenscript Engine

The TokenScript engine is a library that can be used to integrate TokenScript functionality into user-agents, including Wallets and DApps.

The goal of the library is to support JavaScript, Android and iOS targets to enable TokenScript evolution without code duplication and minimal changes to the user-agents. 

# TypeScript library

[The Javascript library](javascript/) is currently the only full implementation of the TokenScript engine and will serve as a reference for porting the engine to other languages. 
The library is written in TypeScript and can be used in JavaScript and TypeScript projects. 

Included with the library is the TokenScript Viewer app.
This app serves as an example implementation of the engine, as well as providing: 

- A way to test TokenScript files during development, via the emulate command of the TokenScript CLI.
- A simple website that allows users to interact with TokenScripts, even if their wallet doesn't implement it.

# Kotlin multiplatform library

[The Kotlin library](multiplatform/) is a WIP to provide a multiplatform implementation of the TokenScript engine.
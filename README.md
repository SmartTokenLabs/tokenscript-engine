
# Tokenscript Engine

The TokenScript engine is a Kotlin multiplatform library that can be used to integrate TokenScript functionality into user-agents, including Wallets and DApps.

The goal of the library is to support Javascript, Android and iOS targets to enable TokenScript evolution without code duplication and minimal changes to the user-agents.

## Development

### Environment

The project is a Kotlin gradle project that can be built with Intellij IDE.

To build simply clone the repo and open in Intellij.

### Local dependencies

Some libraries required patches in order to work correctly, or target all the necessary platforms. 
Until these patches are merged upstream, local versions are required to successfully build the project and run tests against all targets. 
The best way to do this at the moment is by publishing these build to the mavenLocal repository. 
The following sections outline how to publish these libraries.

#### Moko web3 library (For RPC)

1. Pull the TokenScript version of the [moko-web3](https://github.com/TokenScript/moko-web3/) library
2. From a terminal in the project root, run the following gradle command:  
   `./gradlew publishToMavenLocal`

The version number used can be changed using [libs.versions.toml](https://github.com/TokenScript/moko-web3/blob/master/gradle/libs.versions.toml) file.


#### XMLutil library

1. Pull the TokenScript version of the [xmlutil](https://github.com/TokenScript/xmlutil) library
2. From a terminal in the project root, run the following gradle command:  
   `./gradlew publishToMavenLocal`

The version number used can be changed using the [gradle.properties](https://github.com/TokenScript/xmlutil/blob/master/gradle.properties) file. 
Ensure all properties starting in "xmlutil_" are set to the same version.

When library versions are updated, you will also need to update the corresponding versions in [build.gradle.kt](https://github.com/TokenScript/tokenscript-engine/blob/master/build.gradle.kts)


## Sample Applications

Alongside engine development, example applications will be developed for all targets. 
These examples will be a simple TokenScript viewer that will aim to implement all the features that TokenScript provides. 
This will serve the following purposes: 

1. Allow us to test various engine interface designs.
2. Ensure ongoing compatibility with all platforms. 
3. Act as a base to develop integration testing for all platforms. 

The example application are located in the example directory of this repo and are all configured to consume this library as a local dependency.

### Javascript

1. In a terminal, navigate to the /example/javascript directory.
2. Install NPM if you do not already have it installed.
3. Run "npm i" to install dependencies (first time only).
4. Run "npm run serve" to build and serve the example.

### Android

Simply open the /example/android directory in Android Studio, allow gradle to import and run the app.

Note: There is an issue resolving the transitive dependency for XMLutil library due to mismatching build attributes. 
For this reason it is required to import the library separately, using this gradle config in the example application:

```
implementation(project(path: ':tokenscript-engine')){
   transitive = true
   exclude group: 'io.github.pdvrieze.xmlutil', module: 'core'
   exclude group: 'io.github.pdvrieze.xmlutil', module: 'serialization'
}

// The xmlutil library needs to be excluded from transitive dependency resolution and added here due to an issue with gradle build attribute matching.
implementation("io.github.pdvrieze.xmlutil:core-android:0.84.3-STL@jar")
implementation("io.github.pdvrieze.xmlutil:serialization-android:0.84.3-STL@jar")
```

The version of xmlutil used in the engine must be kept in sync with this dependency. 

### iOS

Simply open the /example/ios directory in XCode. Build and run the app.
If you got `The operation couldn’t be completed. Unable to locate a Java Runtime`, checkout [this](https://www.marcogomiero.com/posts/2021/kmp-no-java-runtime-error-xcode/).

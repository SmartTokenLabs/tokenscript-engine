# NOTICE: The Kotlin engine development has been abandoned in favour of the TypeScript implementation due to library availability & other considerations

# Tokenscript Engine

## Note: The multiplatorm library is a work in progress and is not completed. Please contact us if you are interested in contributing.

The TokenScript engine is a Kotlin multiplatform library that can be used to integrate TokenScript functionality into user-agents, including Wallets and DApps.

The goal of the library is to support JavaScript, Android and iOS targets to enable TokenScript evolution without code duplication and minimal changes to the user-agents.

## Development

### Environment

The project is a Kotlin gradle project that can be built with Intellij IDE.

To build simply clone the repo and open in Intellij.

### Modified library dependencies

Some libraries require patches in order to work correctly, or target all the necessary platforms. 
Until these patches are merged upstream, updated versions are required to successfully build the project and run tests against all targets.
The easiest way to do this is by accessing our own versions of the packages via Github package registry.

#### Install via GH package registry

1. Generate a personal access token that has read access to github packages.
2. In the root of this project, create a local.properties file if it doesn't already exist.
3. Add the following property values, substituting the "${}" parts with your own details:
   ```
   gpr.user=${GITHUB_USERNAME}
   gpr.key=${PERSONAL_ACCESS_TOKEN}
   ```

#### Install via mavenLocal

An alternative way is by publishing these builds to the mavenLocal repository. 

You must enable mavelLocal dependency resolution by uncommenting `mavenLocal()` in the repositories section of [build.gradle.kt](https://github.com/TokenScript/tokenscript-engine/blob/master/build.gradle.kts)

The following sections outline how to publish these libraries.

##### Moko web3 library (For RPC)

1. Pull the TokenScript version of the [moko-web3](https://github.com/TokenScript/moko-web3/) library
2. From a terminal in the project root, run the following gradle command:  
   `./gradlew publishToMavenLocal`

The version number used can be changed using [libs.versions.toml](https://github.com/TokenScript/moko-web3/blob/master/gradle/libs.versions.toml) file.


##### XMLutil library

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

### JavaScript

1. In a terminal, navigate to the `/examples/javascript` directory.
2. Install NPM if you do not already have it installed.
3. Run `npm i` to install dependencies (first time only).
4. Run `npm run serve` to build and serve the example.

### Android

Simply open the `/examples/android` directory in Android Studio, allow gradle to import and run the app.

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

Simply open the `/examples/ios` directory in XCode. Build and run the app.

If you got `The operation couldn’t be completed. Unable to locate a Java Runtime`, checkout [this](https://www.marcogomiero.com/posts/2021/kmp-no-java-runtime-error-xcode/).



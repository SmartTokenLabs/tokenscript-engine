import com.android.build.gradle.internal.cxx.configure.gradleLocalProperties

plugins {
    id("com.android.library")
    kotlin("multiplatform") version "1.6.21"
    kotlin("plugin.serialization") version "1.4.32"
    id("maven-publish")
}

group = "org.tokenscript"
version = "1.0-SNAPSHOT"

val serializationVersion = "1.3.3"
val ktorVersion = "1.6.8";
val coroutinesVersion = "1.6.1-native-mt"
val klockVersion = "2.4.13"
val kryptoVersion = "2.4.12"

// Downstream STL versions of these libraries include bug fixes and extra features
val xmlVersion = "0.84.3-STL" // Fixes XML entity deserialization - 0.84.3-SNAPSHOT also works here now, but it doesn't contain iOS build artifacts
val mokoweb3Version = "0.18.1-STL" // Adds Javascript support

repositories {
    google()
    mavenCentral()
    maven {
        url = uri("https://jitpack.io")
    }
    maven {
        url = uri("https://s01.oss.sonatype.org/content/repositories/releases/")
    }
    maven {
        url = uri("https://s01.oss.sonatype.org/content/repositories/snapshots/")
    }

    // Uncomment this if you want to include local builds of xmlutil or moko-web3 libraries
    //mavenLocal()

    val prop = gradleLocalProperties(project.rootDir)

    maven {
        url = uri("https://maven.pkg.github.com/TokenScript/moko-web3")
        credentials {
            username = prop.getProperty("gpr.user") ?: System.getenv("REGISTRY_USER")
            password = prop.getProperty("gpr.key") ?: System.getenv("REGISTRY_TOKEN")
        }
    }

    maven {
        url = uri("https://maven.pkg.github.com/TokenScript/xmlutil")
        credentials {
            username = prop.getProperty("gpr.user") ?: System.getenv("REGISTRY_USER")
            password = prop.getProperty("gpr.key") ?: System.getenv("REGISTRY_TOKEN")
        }
    }
}

kotlin.sourceSets.all {
    languageSettings.optIn("kotlin.RequiresOptIn")
}

tasks.register<Copy>("copyTestResourcesForJs") {
    from("$projectDir/src/commonTest/resources")
    into("${rootProject.buildDir}/js/packages/${rootProject.name}-${project.name}-test/src/commonTest/resources")
}

tasks.register<Copy>("copyTestResourcesForIos") {
    from("$projectDir/src/commonTest/resources")
    into("${rootProject.buildDir}/bin/iosX64/debugTest/resources")
}

tasks.findByName("jsBrowserTest")?.dependsOn("copyTestResourcesForJs")

kotlin {
    jvm {
        compilations.all {
            kotlinOptions.jvmTarget = "1.8"
        }
        testRuns["test"].executionTask.configure {
            useJUnitPlatform()
        }
    }
    js(IR) {
        browser {
            commonWebpackConfig {
                cssSupport.enabled = false
            }
            testTask {
                useMocha {
                    timeout = "20s"
                }
            }
        }
        binaries.library();
    }
    android {
        compilations.all {
            kotlinOptions.jvmTarget = "1.8"
        }
        publishLibraryVariants("release", "debug")
        publishLibraryVariantsGroupedByFlavor = true
    }
    iosArm64 {
        binaries {
            framework {
                baseName = "library"
            }
        }
    }
    iosX64 {
        binaries {
            framework {
                baseName = "library"
            }
        }
    }
    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation(kotlin("stdlib"))

                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:$serializationVersion")

                implementation("io.ktor:ktor-client-serialization:$ktorVersion")
                implementation("io.ktor:ktor-client-core:$ktorVersion")
                implementation("io.ktor:ktor-client-json:$ktorVersion")

                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:$coroutinesVersion")

                // Required for moko web3
                implementation("com.soywiz.korlibs.kbignum:kbignum:2.2.0")

                implementation("com.ionspin.kotlin:bignum:0.3.4")

                implementation("io.github.pdvrieze.xmlutil:core:$xmlVersion")
                implementation("io.github.pdvrieze.xmlutil:serialization:$xmlVersion")

                implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.3.2")
                implementation("com.soywiz.korlibs.klock:klock:$klockVersion")

                implementation("com.soywiz.korlibs.krypto:krypto:$kryptoVersion")

                //implementation("org.jetbrains.kotlinx:kotlinx-io:0.1.16")

                implementation("io.fluidsonic.locale:fluid-locale:0.11.0")

                implementation("dev.icerock.moko:web3:$mokoweb3Version")
            }
        }
        val commonTest by getting {
            dependencies {
                implementation(kotlin("test"))
                //implementation("org.jetbrains.kotlin:kotlin-test-annotations-common")
                //implementation("org.jetbrains.kotlin:kotlin-test-common")

                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutinesVersion")
            }
        }

        val jsMain by getting {
            dependencies {
                implementation(kotlin("stdlib-js"))
                implementation("io.ktor:ktor-client-js:$ktorVersion")

                //implementation(npm("web3", "1.7.3", generateExternals = false))
                //implementation(npm("eth-json-rpc", "0.3.4", generateExternals = false))
            }
        }
        val jsTest by getting {
            dependencies {
                implementation(kotlin("test-js"))
            }
        }

        val jvmCommon by sourceSets.creating

        val jvmMain by getting {
            dependencies {
                api(kotlin("stdlib-jdk8"))

                implementation("io.ktor:ktor-client-cio:$ktorVersion")
                //implementation("com.github.sweexordious:rlp-kotlin:master-SNAPSHOT")
            }
            dependsOn(jvmCommon)
        }
        val jvmTest by getting {
            dependencies {
                implementation("junit:junit:4.13.2")
                //implementation(kotlin("test-junit"))
            }
        }

        val androidMain by getting {
            dependencies {
                rootProject

                implementation(kotlin("stdlib-jdk8"))

                implementation("io.ktor:ktor-client-okhttp:$ktorVersion")
                //implementation("io.ktor:ktor-client-core-jvm:$ktorVersion")
                //implementation("io.ktor:ktor-client-json-jvm:$ktorVersion")

                implementation("io.ktor:ktor-utils-jvm:$ktorVersion")
                implementation("io.ktor:ktor-client-logging-jvm:$ktorVersion")

                //implementation("com.github.sweexordious:rlp-kotlin:master-SNAPSHOT")

                //implementation("io.github.pdvrieze.xmlutil:core-android:$xmlVersion")
                //implementation("io.github.pdvrieze.xmlutil:serialization-android:$xmlVersion")

                implementation("javax.xml.crypto:jsr105-api:1.0.1")
            }
            dependsOn(jvmCommon)
        }
        val androidTest by getting {
            dependencies {
                implementation("junit:junit:4.13.2")
                implementation("androidx.test.ext:junit:1.1.3")
                implementation("androidx.test.ext:junit-ktx:1.1.3")
                implementation("androidx.test.espresso:espresso-core:3.4.0")
            }
        }

        val iosArm64Main by getting
        val iosArm64Test by getting
        val iosX64Main by getting
        val iosX64Test by getting

        val iosMain by sourceSets.creating {
            dependsOn(commonMain)
            dependencies {
                implementation("io.ktor:ktor-client-ios:$ktorVersion")
            }
            iosX64Main.dependsOn(this)
            iosArm64Main.dependsOn(this)
        }

        val iosTest by sourceSets.creating {
            dependsOn(commonTest)
            iosX64Test.dependsOn(this)
            iosArm64Test.dependsOn(this)
        }
    }

    publishing {
        repositories {
            mavenLocal()
        }
    }
}



android {
    compileSdkVersion(32)
    sourceSets["main"].manifest.srcFile("src/androidMain/AndroidManifest.xml")
    defaultConfig {
        minSdkVersion(24)
        targetSdkVersion(32)
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    packagingOptions {
        excludes.add("META-INF/*.kotlin_module")
    }
    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
        }
        getByName("debug") {
            isMinifyEnabled = false
        }
    }
}
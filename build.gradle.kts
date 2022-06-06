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
val coroutinesVersion = "1.6.1"
val klockVersion = "2.4.13"
val kryptoVersion = "2.4.12"
val xmlVersion = "0.84.3"

repositories {
    google()
    mavenCentral()
    maven {
        url = uri("https://jitpack.io")
    }
    maven {
        url = uri("https://s01.oss.sonatype.org/content/repositories/releases/")
    }
    mavenLocal()
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
    /*jvm("android"){
        compilations.all {
            kotlinOptions.jvmTarget = "1.8"
        }
        attributes {
            attribute(org.jetbrains.kotlin.gradle.plugin.KotlinPlatformType.attribute, org.jetbrains.kotlin.gradle.plugin.KotlinPlatformType.androidJvm)
        }
    }*/
    /*iosArm64 {
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
    }*/
    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation(kotlin("stdlib"))

                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:$serializationVersion")

                implementation("io.ktor:ktor-client-serialization:$ktorVersion")
                implementation("io.ktor:ktor-client-core:$ktorVersion")
                implementation("io.ktor:ktor-client-json:$ktorVersion")

                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:$coroutinesVersion-native-mt")

                //implementation("com.soywiz.korlibs.kbignum:kbignum:2.4.12")
                implementation("com.ionspin.kotlin:bignum:0.3.4")

                implementation("io.github.pdvrieze.xmlutil:core:$xmlVersion")
                implementation("io.github.pdvrieze.xmlutil:serialization:$xmlVersion")

                implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.3.2")
                implementation("com.soywiz.korlibs.klock:klock:$klockVersion")

                implementation("com.soywiz.korlibs.krypto:krypto:$kryptoVersion")

                //implementation("org.jetbrains.kotlinx:kotlinx-io:0.1.16")

                implementation("io.fluidsonic.locale:fluid-locale:0.11.0")
            }
        }
        val commonTest by getting {
            dependencies {
                implementation(kotlin("test"))
                //implementation("org.jetbrains.kotlin:kotlin-test-annotations-common")
                //implementation("org.jetbrains.kotlin:kotlin-test-common")

                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutinesVersion-native-mt")
            }
        }

        val jsMain by getting {
            dependencies {
                implementation(kotlin("stdlib-js"))
                implementation("io.ktor:ktor-client-js:$ktorVersion")
            }
        }
        val jsTest by getting {
            dependencies {
                implementation(kotlin("test-js"))
            }
        }

        val jvmMain by getting {
            dependencies {
                api(kotlin("stdlib-jdk8"))

                implementation("io.ktor:ktor-client-cio:$ktorVersion")
                //implementation("com.github.sweexordious:rlp-kotlin:master-SNAPSHOT")
            }
            //dependsOn(jvmCommon)
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
            //dependsOn(jvmCommon)
        }
        val androidTest by getting {
            dependencies {
                implementation("junit:junit:4.13.2")
                implementation("androidx.test.ext:junit:1.1.3")
                implementation("androidx.test.ext:junit-ktx:1.1.3")
                implementation("androidx.test.espresso:espresso-core:3.4.0")
            }
        }

        val jvmCommon by sourceSets.creating {
            jvmMain.dependsOn(this)
            androidMain.dependsOn(this)
        }

        /*val iosArm64Main by getting
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
        }*/

        /*val mokoWeb3 by sourceSets.creating {
            dependsOn(commonMain)
            dependencies {
                implementation("dev.icerock.moko:web3:0.18.0")
            }
            iosMain.dependsOn(this)
            androidMain.dependsOn(this)
            jvmMain.dependsOn(this)
        }*/
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
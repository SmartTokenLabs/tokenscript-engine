pluginManagement {
    repositories {
        google()
        jcenter()
        gradlePluginPortal()
        mavenCentral()
        mavenLocal()
        maven {
            url = uri("https://s01.oss.sonatype.org/content/repositories/releases/")
        }
    }
    resolutionStrategy {
        eachPlugin {
            if (requested.id.namespace == "com.android" || requested.id.name == "kotlin-android-extensions") {
                useModule("com.android.tools.build:gradle:4.1.2")
            }
        }
    }
    //includeBuild("../schema-gen/")
}
rootProject.name = "tokenscript-engine"

//includeBuild("../schema-gen/")
//project(":schema-gen").projectDir = File(settingsDir, "../schema-gen/")

import java.util.Properties
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("rust")
}

val tauriProperties = Properties().apply {
    val propFile = file("tauri.properties")
    if (propFile.exists()) {
        propFile.inputStream().use { load(it) }
    }
}

// Signature release : la clé et son mot de passe ne viennent QUE de l'environnement,
// posés par scripts/fabriquer-apk.sh — jamais sur une ligne de commande, jamais dans
// un fichier. Alias fixe « attables », mot de passe de la clé = celui du magasin (PKCS12).
// Sans ces variables, l'APK release sort non signé (« -unsigned.apk ») : c'est le cas
// voulu du build F-Droid, qui signe avec sa propre clé.
val attablesKeystore: String? = System.getenv("ATTABLES_KEYSTORE")?.takeIf { it.isNotBlank() }
val attablesKeystoreMdp: String? = System.getenv("ATTABLES_KEYSTORE_MDP")?.takeIf { it.isNotEmpty() }
val hasReleaseKeystore = attablesKeystore != null && attablesKeystoreMdp != null

android {
    compileSdk = 37
    signingConfigs {
        if (hasReleaseKeystore) {
            create("release") {
                keyAlias = "attables"
                keyPassword = attablesKeystoreMdp
                storeFile = file(attablesKeystore!!)
                storePassword = attablesKeystoreMdp
            }
        }
    }
    namespace = "attables.biovibralyon.fr"
    defaultConfig {
        manifestPlaceholders["usesCleartextTraffic"] = "false"
        applicationId = "attables.biovibralyon.fr"
        minSdk = 24
        targetSdk = 37
        versionCode = tauriProperties.getProperty("tauri.android.versionCode", "1").toInt()
        versionName = tauriProperties.getProperty("tauri.android.versionName", "1.0")
    }
    buildTypes {
        getByName("debug") {
            manifestPlaceholders["usesCleartextTraffic"] = "true"
            isDebuggable = true
            isJniDebuggable = true
            isMinifyEnabled = false
            packaging {
                jniLibs.keepDebugSymbols.add("*/arm64-v8a/*.so")
                jniLibs.keepDebugSymbols.add("*/armeabi-v7a/*.so")
                jniLibs.keepDebugSymbols.add("*/x86/*.so")
                jniLibs.keepDebugSymbols.add("*/x86_64/*.so")
            }
        }
        getByName("release") {
            if (hasReleaseKeystore) {
                signingConfig = signingConfigs.getByName("release")
            }
            optimization {
               enable = true
            }
            proguardFiles(
                *fileTree(".") {
                  include("**/*.pro")
                  exclude("build/**")
                }.files.toTypedArray()
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    buildFeatures {
        buildConfig = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget = JvmTarget.JVM_1_8
    }
}

rust {
    rootDirRel = "../../../"
}

dependencies {
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.lifecycle:lifecycle-process:2.10.0")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.4")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.0")
}

apply(from = file("tauri.build.gradle.kts"))

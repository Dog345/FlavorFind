plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
}

android {
    namespace  = "com.flavorfind.app"
    compileSdk = 35
    buildToolsVersion = "35.0.0"

    defaultConfig {
        applicationId   = "com.flavorfind.app"
        minSdk          = 26
        targetSdk       = 35
        versionCode     = 1
        versionName     = "1.0.0"

        // Read API base URL from local.properties (falls back to production)
        val apiBase: String = project.findProperty("API_BASE_URL") as String?
            ?: "https://recipe-finder-back-qibi.onrender.com"
        buildConfigField("String", "API_BASE_URL", "\"$apiBase\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isDebuggable = true
            applicationIdSuffix = ".debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose     = true
        buildConfig = true
    }

    // Ship one APK per ABI instead of a fat APK (saves ~30% on device installs)
    splits {
        abi {
            isEnable = true
            reset()
            include("arm64-v8a", "armeabi-v7a", "x86_64")
            isUniversalApk = false
        }
    }

}

dependencies {
    // Core
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(libs.kotlinx.coroutines.android)

    // Compose BOM — keeps all Compose versions in sync
    val composeBom = platform(libs.androidx.compose.bom)
    implementation(composeBom)
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    debugImplementation(libs.androidx.ui.tooling)

    // Navigation
    implementation(libs.androidx.navigation.compose)

    // Hilt DI
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)

    // Networking
    implementation(libs.retrofit.core)
    implementation(libs.retrofit.moshi)
    implementation(libs.okhttp.core)
    implementation(libs.okhttp.logging)

    // JSON
    implementation(libs.moshi.kotlin)
    ksp(libs.moshi.codegen)

    // Images
    implementation(libs.coil.compose)

    // Storage
    implementation(libs.datastore.preferences)

    // Splash screen
    implementation(libs.androidx.splashscreen)
}

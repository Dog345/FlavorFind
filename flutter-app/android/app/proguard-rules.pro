# Flutter-specific rules
-keep class io.flutter.** { *; }
-keep class com.google.android.material.** { *; }
-keep class io.flutter.embedding.** { *; }

# Google Play Core - ALL classes
-keep class com.google.android.play.** { *; }
-keep interface com.google.android.play.** { *; }

# Google Tasks
-keep class com.google.android.gms.tasks.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# HTTP clients and networking
-keep class io.socket.** { *; }
-keep class okhttp3.** { *; }
-keep class retrofit2.** { *; }
-keep class com.google.protobuf.** { *; }

# Google Fonts
-keep class com.google.fonts.** { *; }

# SharedPreferences
-keep class androidx.preference.** { *; }

# AndroidX
-keep class androidx.** { *; }
-keep interface androidx.** { *; }

# Gson
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapter
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# Remove logging
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Keep application classes
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# Suppress warnings for missing classes that are optional
-dontwarn com.google.android.play.**
-dontwarn com.google.android.gms.**

package com.flavorfind.app.data.repository

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.flavorfind.app.BuildConfig
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore(name = "flavorfind_settings")

data class AppSettings(
    val notifications: Boolean   = true,
    val autoSave: Boolean        = true,
    val showNutrition: Boolean   = true,
    val vegetarian: Boolean      = false,
    val vegan: Boolean           = false,
    val glutenFree: Boolean      = false,
    val dairyFree: Boolean       = false,
    val defaultServings: Int     = 2,
    val apiUrl: String           = BuildConfig.API_BASE_URL,
)

data class AppStats(
    val recipesViewed: Int = 0,
    val savedCount: Int    = 0,
    val searchesDone: Int  = 0,
)

@Singleton
class SettingsRepository @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    // ── Keys ─────────────────────────────────────────────────────────────────
    private object Keys {
        val NOTIFICATIONS    = booleanPreferencesKey("s_notifications")
        val AUTO_SAVE        = booleanPreferencesKey("s_autoSave")
        val SHOW_NUTRITION   = booleanPreferencesKey("s_showNutrition")
        val VEGETARIAN       = booleanPreferencesKey("s_vegetarian")
        val VEGAN            = booleanPreferencesKey("s_vegan")
        val GLUTEN_FREE      = booleanPreferencesKey("s_glutenFree")
        val DAIRY_FREE       = booleanPreferencesKey("s_dairyFree")
        val DEFAULT_SERVINGS = intPreferencesKey("s_defaultServings")
        val API_URL          = stringPreferencesKey("s_apiUrl")

        val RECIPES_VIEWED   = intPreferencesKey("stat_recipesViewed")
        val SAVED_COUNT      = intPreferencesKey("stat_savedCount")
        val SEARCHES_DONE    = intPreferencesKey("stat_searchesDone")
    }

    // ── Settings flow ─────────────────────────────────────────────────────────
    val settingsFlow: Flow<AppSettings> = context.dataStore.data.map { prefs ->
        AppSettings(
            notifications   = prefs[Keys.NOTIFICATIONS]    ?: true,
            autoSave        = prefs[Keys.AUTO_SAVE]        ?: true,
            showNutrition   = prefs[Keys.SHOW_NUTRITION]   ?: true,
            vegetarian      = prefs[Keys.VEGETARIAN]       ?: false,
            vegan           = prefs[Keys.VEGAN]            ?: false,
            glutenFree      = prefs[Keys.GLUTEN_FREE]      ?: false,
            dairyFree       = prefs[Keys.DAIRY_FREE]       ?: false,
            defaultServings = prefs[Keys.DEFAULT_SERVINGS] ?: 2,
            apiUrl          = prefs[Keys.API_URL]          ?: BuildConfig.API_BASE_URL,
        )
    }

    // ── Stats flow ────────────────────────────────────────────────────────────
    val statsFlow: Flow<AppStats> = context.dataStore.data.map { prefs ->
        AppStats(
            recipesViewed = prefs[Keys.RECIPES_VIEWED] ?: 0,
            savedCount    = prefs[Keys.SAVED_COUNT]    ?: 0,
            searchesDone  = prefs[Keys.SEARCHES_DONE]  ?: 0,
        )
    }

    // ── Save ──────────────────────────────────────────────────────────────────
    suspend fun saveSettings(s: AppSettings) {
        context.dataStore.edit { prefs ->
            prefs[Keys.NOTIFICATIONS]    = s.notifications
            prefs[Keys.AUTO_SAVE]        = s.autoSave
            prefs[Keys.SHOW_NUTRITION]   = s.showNutrition
            prefs[Keys.VEGETARIAN]       = s.vegetarian
            prefs[Keys.VEGAN]            = s.vegan
            prefs[Keys.GLUTEN_FREE]      = s.glutenFree
            prefs[Keys.DAIRY_FREE]       = s.dairyFree
            prefs[Keys.DEFAULT_SERVINGS] = s.defaultServings
            if (s.apiUrl.isNotBlank()) prefs[Keys.API_URL] = s.apiUrl
        }
    }

    // ── Clear cache ───────────────────────────────────────────────────────────
    suspend fun clearCache() {
        context.dataStore.edit { prefs ->
            prefs.remove(Keys.SAVED_COUNT)
            prefs.remove(Keys.RECIPES_VIEWED)
            prefs.remove(Keys.SEARCHES_DONE)
        }
    }
}

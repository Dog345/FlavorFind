package com.flavorfind.app.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flavorfind.app.BuildConfig
import com.flavorfind.app.data.api.HealthDto
import com.flavorfind.app.data.repository.AppSettings
import com.flavorfind.app.data.repository.AppStats
import com.flavorfind.app.data.repository.RecipeRepository
import com.flavorfind.app.data.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

// ── UI state ──────────────────────────────────────────────────────────────────

sealed interface HealthState {
    data object Loading : HealthState
    data class Online(val requestsLeft: Int?) : HealthState
    data object Offline : HealthState
}

data class SettingsUiState(
    val isSaving: Boolean        = false,
    val savedSnackbar: Boolean   = false,
    val healthState: HealthState = HealthState.Loading,
    val comingSoonFeature: String? = null,   // non-null = modal visible
)

// ── ViewModel ─────────────────────────────────────────────────────────────────

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepo: SettingsRepository,
    private val recipeRepo: RecipeRepository,
) : ViewModel() {

    // Settings & stats are exposed directly from DataStore flows
    val settings: StateFlow<AppSettings> = settingsRepo.settingsFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), AppSettings())

    val stats: StateFlow<AppStats> = settingsRepo.statsFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), AppStats())

    private val _ui = MutableStateFlow(SettingsUiState())
    val ui: StateFlow<SettingsUiState> = _ui.asStateFlow()

    init {
        fetchHealth()
    }

    // ── Settings mutations (in-memory until Save is pressed) ──────────────────

    // We keep a mutable working copy so the user can tweak without auto-saving
    private val _draft = MutableStateFlow<AppSettings?>(null)
    val draft: StateFlow<AppSettings?> = _draft.asStateFlow()

    /** Returns the active draft, falling back to persisted settings */
    private fun currentDraft(): AppSettings = _draft.value ?: settings.value

    fun setNotifications(v: Boolean)  = _draft.update { currentDraft().copy(notifications = v) }
    fun setAutoSave(v: Boolean)       = _draft.update { currentDraft().copy(autoSave = v) }
    fun setShowNutrition(v: Boolean)  = _draft.update { currentDraft().copy(showNutrition = v) }
    fun setVegetarian(v: Boolean)     = _draft.update { currentDraft().copy(vegetarian = v) }
    fun setVegan(v: Boolean)          = _draft.update { currentDraft().copy(vegan = v) }
    fun setGlutenFree(v: Boolean)     = _draft.update { currentDraft().copy(glutenFree = v) }
    fun setDairyFree(v: Boolean)      = _draft.update { currentDraft().copy(dairyFree = v) }
    fun setApiUrl(url: String)        = _draft.update { currentDraft().copy(apiUrl = url) }

    fun incrementServings() {
        val current = currentDraft()
        if (current.defaultServings < 12) _draft.update { current.copy(defaultServings = current.defaultServings + 1) }
    }

    fun decrementServings() {
        val current = currentDraft()
        if (current.defaultServings > 1) _draft.update { current.copy(defaultServings = current.defaultServings - 1) }
    }

    fun setLocalUrl()      = _draft.update { currentDraft().copy(apiUrl = "http://localhost:8000") }
    fun setProductionUrl() = _draft.update { currentDraft().copy(apiUrl = BuildConfig.API_BASE_URL) }

    // ── Persist ───────────────────────────────────────────────────────────────

    fun saveSettings() {
        viewModelScope.launch {
            _ui.update { it.copy(isSaving = true) }
            settingsRepo.saveSettings(currentDraft())
            _draft.value = null   // clear draft — persisted values now drive UI
            _ui.update { it.copy(isSaving = false, savedSnackbar = true) }
        }
    }

    fun dismissSnackbar() = _ui.update { it.copy(savedSnackbar = false) }

    // ── Cache ─────────────────────────────────────────────────────────────────

    fun clearCache() {
        viewModelScope.launch { settingsRepo.clearCache() }
    }

    // ── Health ────────────────────────────────────────────────────────────────

    fun fetchHealth() {
        viewModelScope.launch {
            _ui.update { it.copy(healthState = HealthState.Loading) }
            try {
                val result: HealthDto = recipeRepo.health()
                _ui.update { it.copy(healthState = HealthState.Online(result.remaining)) }
            } catch (_: Exception) {
                _ui.update { it.copy(healthState = HealthState.Offline) }
            }
        }
    }

    // ── Coming soon modal ─────────────────────────────────────────────────────

    fun showComingSoon(feature: String) = _ui.update { it.copy(comingSoonFeature = feature) }
    fun dismissComingSoon()             = _ui.update { it.copy(comingSoonFeature = null) }
}

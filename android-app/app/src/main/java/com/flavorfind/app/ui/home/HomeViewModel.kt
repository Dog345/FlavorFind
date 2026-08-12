package com.flavorfind.app.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flavorfind.app.data.repository.RecipeRepository
import com.flavorfind.app.domain.model.Recipe
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val trending: List<Recipe> = emptyList(),
    val quickBites: List<Recipe> = emptyList(),
    val seasonal: List<Recipe> = emptyList(),
    val chefSignature: List<Recipe> = emptyList(),
    val healthyHeroes: List<Recipe> = emptyList(),
    val desserts: List<Recipe> = emptyList(),
    val comfortFood: List<Recipe> = emptyList(),
    val dateNight: List<Recipe> = emptyList(),
    val breakfast: List<Recipe> = emptyList(),
    val vegan: List<Recipe> = emptyList(),
    val drinks: List<Recipe> = emptyList(),
    val budget: List<Recipe> = emptyList(),
    val kids: List<Recipe> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: RecipeRepository,
) : ViewModel() {

    private val _ui = MutableStateFlow(HomeUiState())
    val ui: StateFlow<HomeUiState> = _ui

    // Expose repository for search bar
    fun getRepository() = repository

    init {
        loadHomeData()
    }

    fun refresh() = loadHomeData()

    private fun loadHomeData() {
        viewModelScope.launch {
            _ui.value = HomeUiState(isLoading = true, error = null)
            try {
                // Load fewer recipes initially (5 per category instead of 8)
                val trendingDeferred      = async { runCatching { repository.randomRecipes(number = 5) }.getOrNull() ?: emptyList() }
                val quickBitesDeferred    = async { runCatching { repository.byType("snack", number = 5) }.getOrNull() ?: emptyList() }
                val seasonalDeferred      = async { runCatching { repository.randomRecipes(number = 5, tags = "seasonal") }.getOrNull() ?: emptyList() }
                val chefSignatureDeferred = async { runCatching { repository.searchRecipes(query = "signature", number = 4) }.getOrNull() ?: emptyList() }
                val healthyDeferred       = async { runCatching { repository.byDiet("healthy", number = 5) }.getOrNull() ?: emptyList() }
                val dessertsDeferred      = async { runCatching { repository.byType("dessert", number = 5) }.getOrNull() ?: emptyList() }
                val comfortDeferred       = async { runCatching { repository.searchRecipes(query = "comfort food", number = 4) }.getOrNull() ?: emptyList() }
                val dateNightDeferred     = async { runCatching { repository.searchRecipes(query = "romantic dinner", number = 4) }.getOrNull() ?: emptyList() }
                val breakfastDeferred     = async { runCatching { repository.byType("breakfast", number = 5) }.getOrNull() ?: emptyList() }
                val veganDeferred         = async { runCatching { repository.byDiet("vegan", number = 5) }.getOrNull() ?: emptyList() }
                val drinksDeferred        = async { runCatching { repository.byType("drink", number = 4) }.getOrNull() ?: emptyList() }
                val budgetDeferred        = async { runCatching { repository.searchRecipes(query = "budget easy", number = 4) }.getOrNull() ?: emptyList() }
                val kidsDeferred          = async { runCatching { repository.searchRecipes(query = "kids friendly", number = 4) }.getOrNull() ?: emptyList() }

                _ui.value = HomeUiState(
                    trending      = trendingDeferred.await(),
                    quickBites    = quickBitesDeferred.await(),
                    seasonal      = seasonalDeferred.await(),
                    chefSignature = chefSignatureDeferred.await(),
                    healthyHeroes = healthyDeferred.await(),
                    desserts      = dessertsDeferred.await(),
                    comfortFood   = comfortDeferred.await(),
                    dateNight     = dateNightDeferred.await(),
                    breakfast     = breakfastDeferred.await(),
                    vegan         = veganDeferred.await(),
                    drinks        = drinksDeferred.await(),
                    budget        = budgetDeferred.await(),
                    kids          = kidsDeferred.await(),
                    isLoading     = false,
                    error         = null,
                )
            } catch (e: Exception) {
                android.util.Log.e("HomeViewModel", "Error loading data: ${e.message}", e)
                _ui.value = HomeUiState(
                    isLoading = false,
                    error     = "Failed to load recipes. Please check your internet connection.",
                )
            }
        }
    }
}

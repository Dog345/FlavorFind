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
                // Fetch all sections in parallel
                val trendingDeferred      = async { repository.randomRecipes(number = 8) }
                val quickBitesDeferred    = async { repository.byType("snack", number = 8) }
                val seasonalDeferred      = async { repository.randomRecipes(number = 8, tags = "seasonal") }
                val chefSignatureDeferred = async { repository.searchRecipes(query = "signature", number = 6) }
                val healthyDeferred       = async { repository.byDiet("healthy", number = 8) }
                val dessertsDeferred      = async { repository.byType("dessert", number = 8) }
                val comfortDeferred       = async { repository.searchRecipes(query = "comfort food", number = 6) }
                val dateNightDeferred     = async { repository.searchRecipes(query = "romantic dinner", number = 6) }
                val breakfastDeferred     = async { repository.byType("breakfast", number = 8) }
                val veganDeferred         = async { repository.byDiet("vegan", number = 8) }
                val drinksDeferred        = async { repository.byType("drink", number = 6) }
                val budgetDeferred        = async { repository.searchRecipes(query = "budget easy", number = 6) }
                val kidsDeferred          = async { repository.searchRecipes(query = "kids friendly", number = 6) }

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
                _ui.value = HomeUiState(
                    isLoading = false,
                    error     = e.message ?: "Failed to load home data",
                )
            }
        }
    }
}

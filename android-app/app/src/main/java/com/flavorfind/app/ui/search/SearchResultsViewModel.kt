package com.flavorfind.app.ui.search

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flavorfind.app.data.repository.RecipeRepository
import com.flavorfind.app.domain.model.Recipe
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SearchUiState(
    val recipes: List<Recipe> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
)

@HiltViewModel
class SearchResultsViewModel @Inject constructor(
    private val repository: RecipeRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val ingredients: String = savedStateHandle["ingredients"] ?: ""

    private val _ui = MutableStateFlow(SearchUiState())
    val ui: StateFlow<SearchUiState> = _ui

    init {
        search()
    }

    private fun search() {
        if (ingredients.isBlank()) {
            _ui.value = SearchUiState(
                recipes = emptyList(),
                isLoading = false,
                error = "No ingredients provided",
            )
            return
        }

        viewModelScope.launch {
            try {
                _ui.value = SearchUiState(isLoading = true, error = null)
                val results = repository.searchByIngredients(ingredients, number = 24)
                _ui.value = SearchUiState(recipes = results, isLoading = false, error = null)
            } catch (e: Exception) {
                _ui.value = SearchUiState(
                    recipes = emptyList(),
                    isLoading = false,
                    error = e.message ?: "Failed to search recipes",
                )
            }
        }
    }
}

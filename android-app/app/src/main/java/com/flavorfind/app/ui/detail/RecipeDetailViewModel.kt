package com.flavorfind.app.ui.detail

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

data class RecipeDetailUiState(
    val recipe: Recipe? = null,
    val isLoading: Boolean = true,
    val error: String? = null,
)

@HiltViewModel
class RecipeDetailViewModel @Inject constructor(
    private val repository: RecipeRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val recipeId: Int = savedStateHandle["recipeId"] ?: 0

    private val _ui = MutableStateFlow(RecipeDetailUiState())
    val ui: StateFlow<RecipeDetailUiState> = _ui

    init {
        loadRecipe()
    }

    private fun loadRecipe() {
        viewModelScope.launch {
            try {
                _ui.value = RecipeDetailUiState(isLoading = true, error = null)
                val recipe = repository.recipeById(recipeId)
                _ui.value = RecipeDetailUiState(recipe = recipe, isLoading = false, error = null)
            } catch (e: Exception) {
                _ui.value = RecipeDetailUiState(
                    recipe = null,
                    isLoading = false,
                    error = e.message ?: "Failed to load recipe"
                )
            }
        }
    }
}

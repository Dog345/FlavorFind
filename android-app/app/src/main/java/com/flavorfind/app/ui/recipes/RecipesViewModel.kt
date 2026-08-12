package com.flavorfind.app.ui.recipes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flavorfind.app.data.repository.RecipeRepository
import com.flavorfind.app.domain.model.Recipe
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

// ── Filter options ────────────────────────────────────────────────────────────

val CUISINE_OPTIONS = listOf(
    "Italian", "Mexican", "Asian", "American", "Indian",
    "Mediterranean", "French", "Japanese", "Thai", "Greek",
)

val DIET_OPTIONS = listOf(
    "Vegetarian", "Vegan", "Gluten Free", "Dairy Free",
    "Keto", "Paleo", "Low Calorie", "High Protein",
)

val TYPE_OPTIONS = listOf(
    "Breakfast", "Lunch", "Dinner", "Snack",
    "Dessert", "Drink", "Salad", "Soup",
)

val TIME_OPTIONS = listOf("Any", "15 min", "30 min", "45 min", "60 min")

// ── Category definitions ──────────────────────────────────────────────────────

data class CategoryItem(
    val label: String,
    val emoji: String,
    val filterKey: String,   // "cuisine" | "diet" | "type"
    val filterValue: String,
    val color: Long,
)

val CATEGORIES: List<CategoryItem> = listOf(
    // Cuisines
    CategoryItem("Italian",       "🍝", "cuisine", "Italian",       0xFFE87A3D),
    CategoryItem("Mexican",       "🌮", "cuisine", "Mexican",       0xFFF5A623),
    CategoryItem("Asian",         "🍜", "cuisine", "Asian",         0xFF4CAF82),
    CategoryItem("American",      "🍔", "cuisine", "American",      0xFF5B8DEF),
    CategoryItem("Indian",        "🍛", "cuisine", "Indian",        0xFFE87A3D),
    CategoryItem("Mediterranean", "🥗", "cuisine", "Mediterranean", 0xFF4CAF82),
    CategoryItem("French",        "🥐", "cuisine", "French",        0xFFF5A623),
    CategoryItem("Japanese",      "🍱", "cuisine", "Japanese",      0xFFEF4444),
    // Diet
    CategoryItem("Vegetarian",    "🥦", "diet", "Vegetarian",  0xFF4CAF82),
    CategoryItem("Vegan",         "🌱", "diet", "Vegan",        0xFF4ADE80),
    CategoryItem("Gluten Free",   "🌾", "diet", "Gluten Free",  0xFFF5A623),
    CategoryItem("Keto",          "🥑", "diet", "Ketogenic",    0xFF5B8DEF),
    CategoryItem("High Protein",  "💪", "diet", "High Protein", 0xFFEF4444),
    // Meal type
    CategoryItem("Breakfast",     "🍳", "type", "Breakfast", 0xFFF5A623),
    CategoryItem("Desserts",      "🍰", "type", "Dessert",   0xFFE87A3D),
    CategoryItem("Drinks",        "🥤", "type", "Drink",     0xFF5B8DEF),
    CategoryItem("Soups",         "🍲", "type", "Soup",      0xFF4CAF82),
    CategoryItem("Salads",        "🥙", "type", "Salad",     0xFF4ADE80),
)

// ── UI state ──────────────────────────────────────────────────────────────────

data class RecipesUiState(
    val query: String                  = "",
    val selectedCuisine: String?       = null,
    val selectedDiet: String?          = null,
    val selectedType: String?          = null,
    val selectedTime: String           = "Any",
    val recipes: List<Recipe>          = emptyList(),
    val isLoading: Boolean             = false,
    val isLoadingMore: Boolean         = false,
    val error: String?                 = null,
    val currentPage: Int               = 0,
    val hasMore: Boolean               = true,
    val categoryRecipes: List<Recipe>  = emptyList(),
    val categoryLoading: Boolean       = false,
    val categoryError: String?         = null,
    val activeCategoryItem: CategoryItem? = null,
)

private const val PAGE_SIZE = 12

// ── ViewModel ─────────────────────────────────────────────────────────────────

@OptIn(FlowPreview::class)
@HiltViewModel
class RecipesViewModel @Inject constructor(
    private val repo: RecipeRepository,
) : ViewModel() {

    private val _ui = MutableStateFlow(RecipesUiState())
    val ui: StateFlow<RecipesUiState> = _ui.asStateFlow()

    private var searchJob: Job? = null

    init {
        // Debounce search query changes
        _ui
            .debounce(400)
            .distinctUntilChanged { a, b ->
                a.query == b.query &&
                a.selectedCuisine == b.selectedCuisine &&
                a.selectedDiet == b.selectedDiet &&
                a.selectedType == b.selectedType &&
                a.selectedTime == b.selectedTime
            }
            .drop(1)   // skip initial emission
            .onEach { search(reset = true) }
            .launchIn(viewModelScope)

        // Initial load
        search(reset = true)
    }

    // ── Query / filter setters ────────────────────────────────────────────────

    fun setQuery(q: String)        = _ui.update { it.copy(query = q) }
    fun clearQuery()               = _ui.update { it.copy(query = "") }

    fun toggleCuisine(v: String)   = _ui.update { it.copy(selectedCuisine = if (it.selectedCuisine == v) null else v) }
    fun toggleDiet(v: String)      = _ui.update { it.copy(selectedDiet    = if (it.selectedDiet    == v) null else v) }
    fun toggleType(v: String)      = _ui.update { it.copy(selectedType    = if (it.selectedType    == v) null else v) }
    fun setTime(v: String)         = _ui.update { it.copy(selectedTime    = v) }

    fun clearFilters() = _ui.update {
        it.copy(selectedCuisine = null, selectedDiet = null, selectedType = null, selectedTime = "Any")
    }

    // ── Search ────────────────────────────────────────────────────────────────

    fun search(reset: Boolean = false) {
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            val state = _ui.value
            val offset = if (reset) 0 else state.currentPage * PAGE_SIZE

            if (reset) {
                _ui.update { it.copy(isLoading = true, error = null, recipes = emptyList(), currentPage = 0, hasMore = true) }
            } else {
                if (!state.hasMore || state.isLoadingMore) return@launch
                _ui.update { it.copy(isLoadingMore = true) }
            }

            try {
                val maxTime = when (state.selectedTime) {
                    "15 min" -> 15
                    "30 min" -> 30
                    "45 min" -> 45
                    "60 min" -> 60
                    else     -> null
                }
                val results = repo.searchRecipes(
                    query        = state.query.takeIf { it.isNotBlank() },
                    cuisine      = state.selectedCuisine,
                    diet         = state.selectedDiet,
                    type         = state.selectedType,
                    maxReadyTime = maxTime,
                    number       = PAGE_SIZE,
                    offset       = offset,
                )
                _ui.update { s ->
                    s.copy(
                        recipes       = if (reset) results else s.recipes + results,
                        isLoading     = false,
                        isLoadingMore = false,
                        currentPage   = if (reset) 1 else s.currentPage + 1,
                        hasMore       = results.size == PAGE_SIZE,
                    )
                }
            } catch (e: Exception) {
                _ui.update {
                    it.copy(
                        isLoading     = false,
                        isLoadingMore = false,
                        error         = e.message ?: "Something went wrong",
                    )
                }
            }
        }
    }

    fun loadMore() {
        val s = _ui.value
        if (!s.isLoading && !s.isLoadingMore && s.hasMore) search(reset = false)
    }

    fun retry() = search(reset = true)

    // ── Category drill-down ───────────────────────────────────────────────────

    fun selectCategory(item: CategoryItem) {
        _ui.update { it.copy(activeCategoryItem = item, categoryRecipes = emptyList(), categoryLoading = true, categoryError = null) }
        viewModelScope.launch {
            try {
                val results = when (item.filterKey) {
                    "cuisine" -> repo.byCuisine(item.filterValue)
                    "diet"    -> repo.byDiet(item.filterValue)
                    else      -> repo.byType(item.filterValue)
                }
                _ui.update { it.copy(categoryRecipes = results, categoryLoading = false) }
            } catch (e: Exception) {
                _ui.update { it.copy(categoryLoading = false, categoryError = e.message ?: "Failed to load") }
            }
        }
    }

    fun clearCategory() = _ui.update { it.copy(activeCategoryItem = null, categoryRecipes = emptyList(), categoryError = null) }
}

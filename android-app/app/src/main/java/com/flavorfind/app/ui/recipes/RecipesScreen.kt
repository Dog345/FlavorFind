package com.flavorfind.app.ui.recipes

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.flavorfind.app.core.theme.Background
import com.flavorfind.app.core.theme.OnBackground
import com.flavorfind.app.core.theme.Primary
import com.flavorfind.app.core.theme.PrimaryDark
import com.flavorfind.app.core.theme.Surface
import com.flavorfind.app.core.theme.SurfaceVariant
import com.flavorfind.app.core.theme.TextSecondary
import com.flavorfind.app.domain.model.Recipe
import com.flavorfind.app.ui.components.RecipeCard

// ── Entry point ───────────────────────────────────────────────────────────────

@Composable
fun RecipesScreen(
    onRecipeClick: (Int) -> Unit = {},
    vm: RecipesViewModel = hiltViewModel(),
) {
    val ui by vm.ui.collectAsStateWithLifecycle()
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
    ) {
        // ── Pill toggle ───────────────────────────────────────────────────────
        TabRow(
            selectedTabIndex = selectedTab,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Surface),
            containerColor = Color.Transparent,
            contentColor   = Primary,
            indicator      = { tabPositions ->
                Box(
                    modifier = Modifier
                        .tabIndicatorOffset(tabPositions[selectedTab])
                        .fillMaxSize()
                        .padding(4.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Primary),
                )
            },
            divider = {},
        ) {
            listOf("Recipes", "Categories").forEachIndexed { index, title ->
                val isSelected = selectedTab == index
                Tab(
                    selected = isSelected,
                    onClick  = { selectedTab = index },
                    modifier = Modifier.clip(RoundedCornerShape(10.dp)),
                    text = {
                        Text(
                            text       = title,
                            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                            fontSize   = 14.sp,
                            color      = if (isSelected) OnBackground else TextSecondary,
                        )
                    },
                )
            }
        }

        // ── Tab content ───────────────────────────────────────────────────────
        when (selectedTab) {
            0 -> RecipesTabContent(ui = ui, vm = vm, onRecipeClick = onRecipeClick)
            1 -> CategoriesTabContent(ui = ui, vm = vm, onRecipeClick = onRecipeClick)
        }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// RECIPES TAB
// ══════════════════════════════════════════════════════════════════════════════

@Composable
private fun RecipesTabContent(
    ui: RecipesUiState,
    vm: RecipesViewModel,
    onRecipeClick: (Int) -> Unit,
) {
    val listState = rememberLazyListState()

    // Load more when near end
    val shouldLoadMore by remember {
        derivedStateOf {
            val lastVisible = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            val total = listState.layoutInfo.totalItemsCount
            total > 0 && lastVisible >= total - 3
        }
    }
    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore) vm.loadMore()
    }

    val hasActiveFilters = ui.selectedCuisine != null ||
            ui.selectedDiet != null ||
            ui.selectedType != null ||
            ui.selectedTime != "Any"

    LazyColumn(
        state           = listState,
        contentPadding  = PaddingValues(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(0.dp),
    ) {
        // ── Search bar ────────────────────────────────────────────────────────
        item {
            OutlinedTextField(
                value         = ui.query,
                onValueChange = vm::setQuery,
                modifier      = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                placeholder   = { Text("Search recipes…", color = TextSecondary, fontSize = 14.sp) },
                leadingIcon   = { Icon(Icons.Default.Search, contentDescription = null, tint = TextSecondary) },
                trailingIcon  = if (ui.query.isNotBlank()) {
                    { IconButton(onClick = vm::clearQuery) { Icon(Icons.Default.Clear, contentDescription = "Clear", tint = TextSecondary) } }
                } else null,
                singleLine    = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(onSearch = { vm.search(reset = true) }),
                shape  = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor   = Primary,
                    unfocusedBorderColor = SurfaceVariant,
                    cursorColor          = Primary,
                    focusedTextColor     = OnBackground,
                    unfocusedTextColor   = OnBackground,
                ),
            )
        }

        // ── Filter chips ──────────────────────────────────────────────────────
        item {
            Column(modifier = Modifier.padding(top = 8.dp)) {
                FilterChipRow(
                    label    = "Cuisine",
                    options  = CUISINE_OPTIONS,
                    selected = ui.selectedCuisine,
                    onSelect = vm::toggleCuisine,
                )
                FilterChipRow(
                    label    = "Diet",
                    options  = DIET_OPTIONS,
                    selected = ui.selectedDiet,
                    onSelect = vm::toggleDiet,
                )
                FilterChipRow(
                    label    = "Type",
                    options  = TYPE_OPTIONS,
                    selected = ui.selectedType,
                    onSelect = vm::toggleType,
                )
                FilterChipRow(
                    label    = "Time",
                    options  = TIME_OPTIONS,
                    selected = ui.selectedTime.takeIf { it != "Any" },
                    onSelect = vm::setTime,
                )
            }
        }

        // ── Active filter summary + clear ─────────────────────────────────────
        if (hasActiveFilters) {
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        buildString {
                            append("Filtering by: ")
                            listOfNotNull(ui.selectedCuisine, ui.selectedDiet, ui.selectedType,
                                ui.selectedTime.takeIf { it != "Any" }).joinTo(this, " · ")
                        },
                        color    = TextSecondary,
                        fontSize = 12.sp,
                        modifier = Modifier.weight(1f),
                    )
                    Text(
                        "Clear",
                        color    = Primary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.clickable(onClick = vm::clearFilters),
                    )
                }
            }
        }

        // ── Section header ────────────────────────────────────────────────────
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment     = Alignment.CenterVertically,
            ) {
                Text(
                    if (ui.query.isBlank() && !hasActiveFilters) "Popular Recipes" else "Results",
                    color      = OnBackground,
                    fontSize   = 18.sp,
                    fontWeight = FontWeight.Bold,
                )
                if (!ui.isLoading && ui.recipes.isNotEmpty()) {
                    Text("${ui.recipes.size}+", color = TextSecondary, fontSize = 12.sp)
                }
            }
        }

        // ── Loading state ─────────────────────────────────────────────────────
        if (ui.isLoading) {
            item {
                Box(
                    modifier         = Modifier.fillMaxWidth().padding(48.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator(color = Primary)
                }
            }
        }

        // ── Error state ───────────────────────────────────────────────────────
        if (ui.error != null && !ui.isLoading) {
            item {
                ErrorState(message = ui.error, onRetry = vm::retry)
            }
        }

        // ── Recipe list ───────────────────────────────────────────────────────
        itemsIndexed(
            items = ui.recipes,
            key   = { _, r -> r.id },
        ) { _, recipe ->
            RecipeCard(
                recipe  = recipe,
                onClick = { onRecipeClick(recipe.id) },
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
            )
        }

        // ── Load more indicator ───────────────────────────────────────────────
        if (ui.isLoadingMore) {
            item {
                Box(
                    modifier         = Modifier.fillMaxWidth().padding(16.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator(
                        color    = Primary,
                        modifier = Modifier.size(24.dp),
                        strokeWidth = 2.dp,
                    )
                }
            }
        }

        // ── End of results ────────────────────────────────────────────────────
        if (!ui.isLoading && !ui.hasMore && ui.recipes.isNotEmpty()) {
            item {
                Text(
                    "You've seen it all!",
                    color     = TextSecondary,
                    fontSize  = 13.sp,
                    textAlign = TextAlign.Center,
                    modifier  = Modifier.fillMaxWidth().padding(24.dp),
                )
            }
        }
    }
}

// ── Filter chip row ───────────────────────────────────────────────────────────

@Composable
private fun FilterChipRow(
    label: String,
    options: List<String>,
    selected: String?,
    onSelect: (String) -> Unit,
) {
    LazyRow(
        contentPadding      = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        item {
            Box(
                modifier         = Modifier.height(36.dp),
                contentAlignment = Alignment.CenterStart,
            ) {
                Text(
                    "$label:",
                    color      = TextSecondary,
                    fontSize   = 12.sp,
                    fontWeight = FontWeight.Medium,
                )
            }
        }
        items(options) { option ->
            val isSelected = selected == option
            val bgColor by animateColorAsState(
                targetValue = if (isSelected) Primary else SurfaceVariant,
                animationSpec = tween(150),
                label = "chipBg",
            )
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(bgColor)
                    .clickable { onSelect(option) }
                    .padding(horizontal = 12.dp, vertical = 6.dp),
            ) {
                Text(
                    option,
                    color      = if (isSelected) Color.White else TextSecondary,
                    fontSize   = 12.sp,
                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                )
            }
        }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORIES TAB
// ══════════════════════════════════════════════════════════════════════════════

@Composable
private fun CategoriesTabContent(
    ui: RecipesUiState,
    vm: RecipesViewModel,
    onRecipeClick: (Int) -> Unit,
) {
    // If a category is selected show its recipe list; otherwise show the grid
    if (ui.activeCategoryItem != null) {
        CategoryRecipeList(
            ui           = ui,
            onRecipeClick = onRecipeClick,
            onBack       = vm::clearCategory,
        )
    } else {
        CategoryGrid(
            onCategoryClick = vm::selectCategory,
        )
    }
}

// ── Category grid ─────────────────────────────────────────────────────────────

@Composable
private fun CategoryGrid(
    onCategoryClick: (CategoryItem) -> Unit,
) {
    // Group into sections
    val cuisines = CATEGORIES.filter { it.filterKey == "cuisine" }
    val diets    = CATEGORIES.filter { it.filterKey == "diet" }
    val types    = CATEGORIES.filter { it.filterKey == "type" }

    LazyColumn(
        contentPadding      = PaddingValues(bottom = 32.dp),
        verticalArrangement = Arrangement.spacedBy(0.dp),
    ) {
        item { CategorySectionHeader("🌍 World Cuisines") }
        item {
            LazyVerticalGrid(
                columns             = GridCells.Fixed(4),
                contentPadding      = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier            = Modifier.height(((cuisines.size / 4 + 1) * 100).dp),
            ) {
                items(cuisines, key = { it.label }) { item ->
                    CategoryTile(item = item, onClick = { onCategoryClick(item) })
                }
            }
        }

        item { CategorySectionHeader("🥗 Dietary") }
        item {
            LazyVerticalGrid(
                columns             = GridCells.Fixed(4),
                contentPadding      = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier            = Modifier.height(((diets.size / 4 + 1) * 100).dp),
            ) {
                items(diets, key = { it.label }) { item ->
                    CategoryTile(item = item, onClick = { onCategoryClick(item) })
                }
            }
        }

        item { CategorySectionHeader("🍽️ Meal Type") }
        item {
            LazyVerticalGrid(
                columns             = GridCells.Fixed(4),
                contentPadding      = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier            = Modifier.height(((types.size / 4 + 1) * 100).dp),
            ) {
                items(types, key = { it.label }) { item ->
                    CategoryTile(item = item, onClick = { onCategoryClick(item) })
                }
            }
        }
    }
}

@Composable
private fun CategorySectionHeader(title: String) {
    Text(
        text       = title,
        color      = OnBackground,
        fontSize   = 18.sp,
        fontWeight = FontWeight.Bold,
        modifier   = Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 4.dp),
    )
}

@Composable
private fun CategoryTile(
    item: CategoryItem,
    onClick: () -> Unit,
) {
    val accent = Color(item.color)
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .background(accent.copy(alpha = 0.12f))
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp, horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(item.emoji, fontSize = 28.sp)
        Spacer(Modifier.height(6.dp))
        Text(
            item.label,
            color      = accent,
            fontSize   = 11.sp,
            fontWeight = FontWeight.SemiBold,
            textAlign  = TextAlign.Center,
            maxLines   = 2,
            overflow   = TextOverflow.Ellipsis,
        )
    }
}

// ── Category recipe list (drill-down) ─────────────────────────────────────────

@Composable
private fun CategoryRecipeList(
    ui: RecipesUiState,
    onRecipeClick: (Int) -> Unit,
    onBack: () -> Unit,
) {
    val item = ui.activeCategoryItem ?: return
    val accent = Color(item.color)

    Column(modifier = Modifier.fillMaxSize()) {
        // Header with back button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = OnBackground)
            }
            Text(item.emoji, fontSize = 22.sp)
            Spacer(Modifier.width(8.dp))
            Column {
                Text(item.label, color = OnBackground, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text(
                    item.filterKey.replaceFirstChar { it.uppercase() },
                    color = TextSecondary, fontSize = 12.sp,
                )
            }
        }

        // Accent bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(2.dp)
                .background(Brush.horizontalGradient(listOf(accent, accent.copy(alpha = 0f)))),
        )

        when {
            ui.categoryLoading -> Box(
                modifier         = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(color = Primary)
            }

            ui.categoryError != null -> ErrorState(
                message = ui.categoryError,
                onRetry = {},
            )

            ui.categoryRecipes.isEmpty() -> Box(
                modifier         = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
                Text("No recipes found", color = TextSecondary, fontSize = 14.sp)
            }

            else -> LazyColumn(
                contentPadding      = PaddingValues(bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(0.dp),
            ) {
                item {
                    Text(
                        "${ui.categoryRecipes.size} recipes",
                        color    = TextSecondary,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    )
                }
                items(ui.categoryRecipes, key = { it.id }) { recipe ->
                    RecipeCard(
                        recipe   = recipe,
                        onClick  = { onRecipeClick(recipe.id) },
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                    )
                }
            }
        }
    }
}

// ── Shared error state ────────────────────────────────────────────────────────

@Composable
private fun ErrorState(message: String, onRetry: () -> Unit) {
    Column(
        modifier            = Modifier.fillMaxWidth().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("😕", fontSize = 40.sp)
        Spacer(Modifier.height(12.dp))
        Text(
            message,
            color     = TextSecondary,
            fontSize  = 14.sp,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(16.dp))
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(12.dp))
                .background(Brush.horizontalGradient(listOf(Primary, PrimaryDark)))
                .clickable(onClick = onRetry)
                .padding(horizontal = 24.dp, vertical = 10.dp),
        ) {
            Text("Try Again", color = Color.White, fontWeight = FontWeight.SemiBold)
        }
    }
}

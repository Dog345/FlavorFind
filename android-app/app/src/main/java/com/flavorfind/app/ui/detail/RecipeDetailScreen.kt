package com.flavorfind.app.ui.detail

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.flavorfind.app.core.theme.Background
import com.flavorfind.app.core.theme.Primary
import com.flavorfind.app.core.theme.PrimaryDark
import com.flavorfind.app.core.theme.Surface
import com.flavorfind.app.core.theme.TextSecondary
import com.flavorfind.app.domain.model.AnalyzedInstruction
import com.flavorfind.app.domain.model.Ingredient
import com.flavorfind.app.domain.model.Recipe
import kotlinx.coroutines.launch

@Composable
fun RecipeDetailScreen(
    recipeId: Int,
    onBack: () -> Unit = {},
    vm: RecipeDetailViewModel = hiltViewModel(),
) {
    val ui = vm.ui.collectAsStateWithLifecycle(RecipeDetailUiState()).value

    when {
        ui.isLoading -> {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Background),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(color = Primary)
            }
        }
        ui.error != null -> {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Background),
                contentAlignment = Alignment.Center,
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Text(
                        "❌ Failed to load recipe",
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        ui.error ?: "Unknown error",
                        color = TextSecondary,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(horizontal = 12.dp),
                    )
                }
            }
        }
        ui.recipe != null -> {
            RecipeDetailContent(
                recipe = ui.recipe,
                onBack = onBack,
            )
        }
    }
}

// ── Main recipe detail content ─────────────────────────────────────────────────

@Composable
private fun RecipeDetailContent(
    recipe: Recipe,
    onBack: () -> Unit = {},
) {
    val pagerState = rememberPagerState { 2 } // Ingredients + Instructions
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
    ) {
        // ── Header with image and back button ──────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(250.dp)
                .background(Surface),
        ) {
            // Recipe image
            AsyncImage(
                model = recipe.image,
                contentDescription = recipe.title,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(0.dp)),
                contentScale = ContentScale.Crop,
            )

            // Gradient overlay at top for status bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.Black.copy(alpha = 0.6f),
                                Color.Transparent,
                            )
                        )
                    )
            )

            // Back button
            IconButton(
                onClick = onBack,
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(top = 8.dp, start = 8.dp),
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White,
                )
            }
        }

        // ── Recipe info section ───────────────────────────────────────────────
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Surface)
                .padding(16.dp),
        ) {
            Text(
                recipe.title,
                color = Color.White,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(modifier = Modifier.height(8.dp))

            // Meta info
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (recipe.readyInMinutes != null) {
                    MetaChip(
                        icon = "⏱️",
                        label = "${recipe.readyInMinutes} min",
                    )
                }
                if (recipe.servings != null) {
                    MetaChip(
                        icon = "🍽️",
                        label = "${recipe.servings} servings",
                    )
                }
                if (recipe.spoonacularScore != null) {
                    MetaChip(
                        icon = "⭐",
                        label = String.format("%.1f", recipe.spoonacularScore),
                    )
                }
            }

            // Summary
            if (recipe.summary != null && recipe.summary.isNotBlank()) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    recipe.summary.replace(Regex("<[^>]*>"), ""), // Remove HTML tags
                    color = TextSecondary,
                    fontSize = 13.sp,
                    lineHeight = 18.sp,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }

        // ── Tab row ───────────────────────────────────────────────────────────
        TabRow(
            selectedTabIndex = pagerState.currentPage,
            modifier = Modifier
                .fillMaxWidth()
                .background(Background),
            containerColor = Background,
            contentColor = Primary,
            indicator = { tabPositions ->
                Box(
                    modifier = Modifier
                        .tabIndicatorOffset(tabPositions[pagerState.currentPage])
                        .fillMaxWidth()
                        .height(3.dp)
                        .background(Primary),
                )
            },
        ) {
            Tab(
                selected = pagerState.currentPage == 0,
                onClick = {
                    scope.launch { pagerState.animateScrollToPage(0) }
                },
                text = {
                    Text(
                        "Ingredients (${recipe.extendedIngredients.size})",
                        fontSize = 14.sp,
                        fontWeight = if (pagerState.currentPage == 0) FontWeight.Bold else FontWeight.Normal,
                    )
                },
                selectedContentColor = Primary,
                unselectedContentColor = TextSecondary,
            )
            Tab(
                selected = pagerState.currentPage == 1,
                onClick = {
                    scope.launch { pagerState.animateScrollToPage(1) }
                },
                text = {
                    Text(
                        "Instructions",
                        fontSize = 14.sp,
                        fontWeight = if (pagerState.currentPage == 1) FontWeight.Bold else FontWeight.Normal,
                    )
                },
                selectedContentColor = Primary,
                unselectedContentColor = TextSecondary,
            )
        }

        // ── Pager content ─────────────────────────────────────────────────────
        HorizontalPager(
            state = pagerState,
            modifier = Modifier
                .fillMaxSize()
                .background(Background),
            pageSpacing = 0.dp,
        ) { page ->
            when (page) {
                0 -> IngredientsTab(recipe.extendedIngredients)
                1 -> InstructionsTab(recipe.analyzedInstructions)
            }
        }
    }
}

// ── Meta chip (time, servings, score) ──────────────────────────────────────────

@Composable
private fun MetaChip(icon: String, label: String) {
    Box(
        modifier = Modifier
            .background(Background, RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 6.dp),
    ) {
        Row(
            modifier = Modifier.wrapContentHeight(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
        ) {
            Text(icon, fontSize = 12.sp)
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                label,
                fontSize = 12.sp,
                color = TextSecondary,
                fontWeight = FontWeight.Medium,
            )
        }
    }
}

// ── Ingredients tab ───────────────────────────────────────────────────────────

@Composable
private fun IngredientsTab(ingredients: List<Ingredient>) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        items(ingredients) { ingredient ->
            IngredientRow(ingredient)
        }
    }
}

@Composable
private fun IngredientRow(ingredient: Ingredient) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Surface, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // Ingredient image thumbnail
        if (ingredient.image.isNotBlank()) {
            AsyncImage(
                model = "https://spoonacular.com/cdn/ingredients_100x100/${ingredient.image}",
                contentDescription = ingredient.name,
                modifier = Modifier
                    .width(60.dp)
                    .height(60.dp)
                    .clip(RoundedCornerShape(8.dp)),
                contentScale = ContentScale.Crop,
            )
        } else {
            Box(
                modifier = Modifier
                    .width(60.dp)
                    .height(60.dp)
                    .background(Background, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Text("🥘", fontSize = 28.sp)
            }
        }

        // Ingredient info
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                ingredient.name,
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
            )
            Text(
                ingredient.original,
                color = TextSecondary,
                fontSize = 12.sp,
                overflow = TextOverflow.Ellipsis,
                maxLines = 1,
            )
            Text(
                "${ingredient.amount} ${ingredient.unit}",
                color = Primary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
            )
        }
    }
}

// ── Instructions tab ──────────────────────────────────────────────────────────

@Composable
private fun InstructionsTab(instructions: List<AnalyzedInstruction>) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        if (instructions.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 48.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                    ) {
                        Text(
                            "📝",
                            fontSize = 48.sp,
                            modifier = Modifier.padding(bottom = 12.dp),
                        )
                        Text(
                            "No instructions available",
                            color = TextSecondary,
                            fontSize = 14.sp,
                        )
                    }
                }
            }
        } else {
            instructions.forEachIndexed { idx, instruction ->
                item {
                    if (instruction.name.isNotBlank()) {
                        Text(
                            instruction.name,
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }

                items(instruction.steps) { step ->
                    StepRow(step.number, step.step)
                }

                if (idx < instructions.size - 1) {
                    item { Spacer(modifier = Modifier.height(8.dp)) }
                }
            }
        }
    }
}

@Composable
private fun StepRow(number: Int, text: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Surface, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // Step number badge
        Box(
            modifier = Modifier
                .width(32.dp)
                .height(32.dp)
                .background(Primary, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                number.toString(),
                color = Background,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
            )
        }

        // Step text
        Text(
            text,
            color = Color.White,
            fontSize = 13.sp,
            lineHeight = 18.sp,
            modifier = Modifier
                .weight(1f)
                .align(Alignment.Top),
        )
    }
}

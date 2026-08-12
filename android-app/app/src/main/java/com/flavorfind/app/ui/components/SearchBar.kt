package com.flavorfind.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flavorfind.app.core.theme.Background
import com.flavorfind.app.core.theme.Primary
import com.flavorfind.app.core.theme.PrimaryDark
import com.flavorfind.app.core.theme.Surface
import com.flavorfind.app.core.theme.TextSecondary
import com.flavorfind.app.data.api.AutocompleteDto
import com.flavorfind.app.data.repository.RecipeRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.Job

// Quick ingredient suggestions for UX
private val QUICK_INGREDIENTS = listOf(
    "chicken", "pasta", "tomato", "cheese", "rice",
    "beef", "fish", "eggs", "mushrooms", "spinach",
)

@Composable
fun SearchBar(
    onSearch: (ingredients: String) -> Unit,
    repository: RecipeRepository,
    modifier: Modifier = Modifier,
) {
    var query by remember { mutableStateOf("") }
    var suggestions by remember { mutableStateOf<List<AutocompleteDto>>(emptyList()) }
    var showSuggestions by remember { mutableStateOf(false) }
    var isLoadingSuggestions by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    // Autocomplete debounced search - only trigger on manual edits
    LaunchedEffect(query) {
        if (query.length < 2) {
            suggestions = emptyList()
            showSuggestions = false
            isLoadingSuggestions = false
            return@LaunchedEffect
        }

        // Cancel any previous request
        isLoadingSuggestions = true
        
        // Debounce the search
        val job = scope.launch {
            delay(500) // Wait 500ms after user stops typing
            
            try {
                val results = repository.autocomplete(query.trim())
                if (results.isNotEmpty()) {
                    suggestions = results.take(6)
                    showSuggestions = true
                } else {
                    suggestions = emptyList()
                    showSuggestions = false
                }
            } catch (e: Exception) {
                // Network error or API issue - silently fail
                suggestions = emptyList()
                showSuggestions = false
            } finally {
                isLoadingSuggestions = false
            }
        }
    }

    Column(
        modifier = modifier.fillMaxWidth(),
    ) {
        // ── Background section with search ────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Primary.copy(alpha = 0.15f),
                            Primary.copy(alpha = 0.05f),
                        ),
                        startY = 0f,
                        endY = 600f,
                    )
                )
                .padding(horizontal = 16.dp, vertical = 20.dp),
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // ── Search Input & Button Row ──────────────────────────────────────
                Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(
                            Surface.copy(alpha = 0.8f),
                            Surface.copy(alpha = 0.95f),
                        )
                    ),
                    shape = RoundedCornerShape(16.dp),
                )
                .border(
                    width = 1.5.dp,
                    color = Primary.copy(alpha = 0.25f),
                    shape = RoundedCornerShape(16.dp),
                )
                .padding(horizontal = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            // Search icon
            Icon(
                imageVector = Icons.Filled.Search,
                contentDescription = "Search",
                tint = TextSecondary,
                modifier = Modifier
                    .width(22.dp)
                    .height(22.dp),
            )

            // Input field
            Box(modifier = Modifier.weight(1f)) {
                BasicTextField(
                    value = query,
                    onValueChange = { query = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    textStyle = androidx.compose.ui.text.TextStyle(
                        color = Color.White,
                        fontSize = 15.sp,
                    ),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    keyboardActions = KeyboardActions(
                        onSearch = {
                            onSearch(query)
                            showSuggestions = false
                        }
                    ),
                    decorationBox = { innerTextField ->
                        if (query.isEmpty()) {
                            Text(
                                "Enter ingredients...",
                                color = TextSecondary.copy(alpha = 0.6f),
                                fontSize = 15.sp,
                            )
                        }
                        innerTextField()
                    },
                )
            }

            // Loading indicator or clear button
            if (isLoadingSuggestions) {
                CircularProgressIndicator(
                    modifier = Modifier
                        .width(20.dp)
                        .height(20.dp),
                    color = Primary,
                    strokeWidth = 2.dp,
                )
            } else if (query.isNotEmpty()) {
                IconButton(
                    onClick = {
                        query = ""
                        showSuggestions = false
                    },
                    modifier = Modifier.width(40.dp),
                ) {
                    Icon(
                        imageVector = Icons.Filled.Clear,
                        contentDescription = "Clear",
                        tint = TextSecondary,
                        modifier = Modifier
                            .width(20.dp)
                            .height(20.dp),
                    )
                }
            }

            // Search button
            Box(
                modifier = Modifier
                    .width(50.dp)
                    .height(40.dp)
                    .background(
                        brush = Brush.linearGradient(
                            colors = listOf(Primary, PrimaryDark),
                        ),
                        shape = RoundedCornerShape(12.dp),
                    )
                    .clickable(
                        indication = null,
                        interactionSource = remember { MutableInteractionSource() },
                    ) {
                        onSearch(query)
                        showSuggestions = false
                    },
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    "🔥",
                    fontSize = 18.sp,
                    textAlign = TextAlign.Center,
                )
            }
        }

                // ── Suggestions dropdown ───────────────────────────────────────────
                AnimatedVisibility(
                    visible = showSuggestions && suggestions.isNotEmpty(),
                    enter = fadeIn(),
                    exit = fadeOut(),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp)
                            .background(Surface, RoundedCornerShape(14.dp))
                            .border(
                                1.5.dp,
                                Primary.copy(alpha = 0.2f),
                                RoundedCornerShape(14.dp),
                            )
                            .clip(RoundedCornerShape(14.dp)),
                    ) {
                        LazyColumn(
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            items(suggestions) { suggestion ->
                                SuggestionItem(
                                    name = suggestion.name ?: "",
                                    onClick = {
                                        query = suggestion.name ?: ""
                                        onSearch(suggestion.name ?: "")
                                        showSuggestions = false
                                    },
                                )
                            }
                        }
                    }
                }

                // ── Quick ingredient tags ──────────────────────────────────────────
                Spacer(modifier = Modifier.height(14.dp))
                Text(
                    "Quick suggestions",
                    color = TextSecondary,
                    fontSize = 12.sp,
                )
                Spacer(modifier = Modifier.height(10.dp))

                // Scrollable row of quick ingredients
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    QUICK_INGREDIENTS.forEach { ingredient ->
                        QuickIngredientTag(
                            ingredient = ingredient,
                            onClick = {
                                // Append to search bar instead of direct search
                                query = if (query.isBlank()) {
                                    ingredient
                                } else if (query.contains(ingredient, ignoreCase = true)) {
                                    query // Already added
                                } else {
                                    "$query, $ingredient"
                                }
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SuggestionItem(
    name: String,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(
                indication = null,
                interactionSource = remember { MutableInteractionSource() },
                onClick = onClick,
            )
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(
            "🌿",
            fontSize = 16.sp,
        )
        Text(
            name,
            color = Color.White,
            fontSize = 15.sp,
        )
    }
}

@Composable
private fun QuickIngredientTag(
    ingredient: String,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(
                        Primary.copy(alpha = 0.2f),
                        Primary.copy(alpha = 0.12f),
                    )
                ),
                shape = RoundedCornerShape(10.dp),
            )
            .border(1.2.dp, Primary.copy(alpha = 0.35f), RoundedCornerShape(10.dp))
            .clickable(
                indication = null,
                interactionSource = remember { MutableInteractionSource() },
                onClick = onClick,
            )
            .padding(horizontal = 12.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            ingredient.replaceFirstChar { it.uppercase() },
            color = Primary,
            fontSize = 13.sp,
            fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold,
        )
    }
}

package com.flavorfind.app.ui.home

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.flavorfind.app.core.theme.Background
import com.flavorfind.app.core.theme.OnBackground
import com.flavorfind.app.core.theme.Primary
import com.flavorfind.app.core.theme.PrimaryDark
import com.flavorfind.app.core.theme.Surface
import com.flavorfind.app.core.theme.TextSecondary
import com.flavorfind.app.domain.model.Recipe

// ── Static data (mirrored from the React Native app) ─────────────────────────

private data class WorldCuisine(
    val id: String,
    val name: String,
    val flag: String,
    val query: String,
    val color: Color,
)

private val WORLD_CUISINES = listOf(
    WorldCuisine("it", "Italian",    "🇮🇹", "italian",    Color(0xFFE87A3D)),
    WorldCuisine("jp", "Japanese",   "🇯🇵", "japanese",   Color(0xFFE83D8C)),
    WorldCuisine("mx", "Mexican",    "🇲🇽", "mexican",    Color(0xFFE83D3D)),
    WorldCuisine("in", "Indian",     "🇮🇳", "indian",     Color(0xFFE8A63D)),
    WorldCuisine("th", "Thai",       "🇹🇭", "thai",       Color(0xFF3DE87A)),
    WorldCuisine("fr", "French",     "🇫🇷", "french",     Color(0xFF3D9EE8)),
    WorldCuisine("gr", "Greek",      "🇬🇷", "greek",      Color(0xFF4ADE80)),
    WorldCuisine("lb", "Lebanese",   "🇱🇧", "lebanese",   Color(0xFFE88A3D)),
    WorldCuisine("vn", "Vietnamese", "🇻🇳", "vietnamese", Color(0xFF3DE8B0)),
    WorldCuisine("kr", "Korean",     "🇰🇷", "korean",     Color(0xFFE83D5E)),
)

private data class CookingTip(val emoji: String, val tip: String)

private val COOKING_TIPS = listOf(
    CookingTip("🥩", "Rest meat 10 mins after cooking"),
    CookingTip("🥚", "Room temp eggs for baking"),
    CookingTip("🍝", "Salt pasta water like the sea"),
    CookingTip("🔪", "Sharp knife = safer knife"),
    CookingTip("🧑‍🍳", "Mise en place = organized"),
    CookingTip("👅", "Taste as you cook"),
    CookingTip("🍞", "Let dough rest"),
    CookingTip("🔥", "Hot pan = better sear"),
)

// ── Main screen ───────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onRecipeClick: (Int) -> Unit = {},
    onSearchIngredients: (String) -> Unit = {},
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val state by viewModel.ui.collectAsState()
    var ingredientQuery by remember { mutableStateOf("") }
    var isRefreshing by remember { mutableStateOf(false) }

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = {
            isRefreshing = true
            viewModel.refresh()
            isRefreshing = false
        },
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
    ) {
        if (state.isLoading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = Primary)
                    Spacer(Modifier.height(16.dp))
                    Text("🍳 Loading delicious recipes...", color = TextSecondary, fontSize = 14.sp)
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState()),
            ) {
                // ── Hero Search ───────────────────────────────────────────────
                HeroSearchSection(
                    query    = ingredientQuery,
                    onQueryChange = { ingredientQuery = it },
                    onSearch = { onSearchIngredients(it) },
                )

                // ── Section 1: Trending Now ───────────────────────────────────
                if (state.trending.isNotEmpty()) {
                    SectionHeader("🔥 Trending Now", "Most popular this week")
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(state.trending) { recipe ->
                            TrendingCard(recipe = recipe, onClick = { onRecipeClick(recipe.id) })
                        }
                    }
                    Spacer(Modifier.height(24.dp))
                }

                // ── Section 2: Quick Bites ────────────────────────────────────
                if (state.quickBites.isNotEmpty()) {
                    SectionHeader("⚡ Quick Bites", "Ready in under 30 minutes")
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(state.quickBites) { recipe ->
                            QuickBiteCard(recipe = recipe, onClick = { onRecipeClick(recipe.id) })
                        }
                    }
                    Spacer(Modifier.height(24.dp))
                }

                // ── Section 3: World Cuisines (grid) ─────────────────────────
                SectionHeader("🌍 World Cuisines", "Explore global flavors", showSeeAll = false)
                WorldCuisinesGrid(onCuisineClick = { query -> onSearchIngredients(query) })
                Spacer(Modifier.height(24.dp))

                // ── Section 4: Seasonal Spotlight ────────────────────────────
                if (state.seasonal.isNotEmpty()) {
                    SectionHeader("🌱 Seasonal Spotlight", "What's fresh right now")
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(state.seasonal) { recipe ->
                            SeasonalCard(recipe = recipe, onClick = { onRecipeClick(recipe.id) })
                        }
                    }
                    Spacer(Modifier.height(24.dp))
                }

                // ── Section 5: Chef's Signature ───────────────────────────────
                if (state.chefSignature.isNotEmpty()) {
                    SectionHeader("👨‍🍳 Chef's Signature", "Masterchef creations")
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(state.chefSignature) { recipe ->
                            ChefCard(recipe = recipe, onClick = { onRecipeClick(recipe.id) })
                        }
                    }
                    Spacer(Modifier.height(24.dp))
                }

                // ── Section 6: Healthy Heroes ─────────────────────────────────
                if (state.healthyHeroes.isNotEmpty()) {
                    SectionHeader("🥗 Healthy Heroes", "Under 500 calories")
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(state.healthyHeroes) { recipe ->
                            HealthCard(recipe = recipe, onClick = { onRecipeClick(recipe.id) })
                        }
                    }
                    Spacer(Modifier.height(24.dp))
                }

                // ── Section 7: Dessert Paradise ───────────────────────────────
                if (state.desserts.isNotEmpty()) {
                    SectionHeader("🍰 Dessert Paradise", "Sweet indulgence")
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(state.desserts) { recipe ->
                            DessertCard(recipe = recipe, onClick = { onRecipeClick(recipe.id) })
                        }
                    }
                    Spacer(Modifier.height(24.dp))
                }

                // ── Section 8: Comfort Food ───────────────────────────────────
                if (state.comfortFood.isNotEmpty()) {
                    SectionHeader("😌 Comfort Food", "Warm your soul")
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(state.comfortFood) { recipe ->
                            ComfortCard(recipe = recipe, onClick = { onRecipeClick(recipe.id) })
                        }
                    }
                    Spacer(Modifier.height(24.dp))
                }

                // ── Section 9: Date Night ─────────────────────────────────────
                if (state.dateNight.isNotEmpty()) {
                    SectionHeader("💕 Date Night", "Impress someone special")
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(state.dateNight) { recipe ->
                            DateNightCard(recipe = recipe, onClick = { onRecipeClick(recipe.id) })
                        }
                    }
                    Spacer(Modifier.height(24.dp))
                }

                // ── Section 10: Breakfast Club ────────────────────────────────
                if (state.breakfast.isNotEmpty()) {
                    SectionHeader("☀️ Breakfast Club", "Start your day right")
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(state.breakfast) { recipe ->
                            BreakfastCard(recipe = recipe, onClick = { onRecipeClick(recipe.id) })
                        }
                    }
                    Spacer(Modifier.height(24.dp))
                }

                // ── Section 11: Vegan Vibes ───────────────────────────────────
                if (state.vegan.isNotEmpty()) {
                    SectionHeader("🌱 Vegan Vibes", "100% plant-based")
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(state.vegan) { recipe ->
                            VeganCard(recipe = recipe, onClick = { onRecipeClick(recipe.id) })
                        }
                    }
                    Spacer(Modifier.height(24.dp))
                }

                // ── Section 12: Drinks & Cocktails ────────────────────────────
                if (state.drinks.isNotEmpty()) {
                    SectionHeader("🍸 Drinks & Cocktails", "Raise your glass")
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(state.drinks) { recipe ->
                            DrinkCard(recipe = recipe, onClick = { onRecipeClick(recipe.id) })
                        }
                    }
                    Spacer(Modifier.height(24.dp))
                }

                // ── Section 13: Budget Meals ──────────────────────────────────
                if (state.budget.isNotEmpty()) {
                    SectionHeader("💰 Budget Meals", "Delicious on a dime")
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(state.budget) { recipe ->
                            BudgetCard(recipe = recipe, onClick = { onRecipeClick(recipe.id) })
                        }
                    }
                    Spacer(Modifier.height(24.dp))
                }

                // ── Section 14: Kids' Favorites ───────────────────────────────
                if (state.kids.isNotEmpty()) {
                    SectionHeader("👶 Kids' Favorites", "Fun for little ones")
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(state.kids) { recipe ->
                            KidsCard(recipe = recipe, onClick = { onRecipeClick(recipe.id) })
                        }
                    }
                    Spacer(Modifier.height(24.dp))
                }

                // ── Section 15: Pro Cooking Tips ──────────────────────────────
                SectionHeader("💡 Pro Cooking Tips", "Level up your skills", showSeeAll = false)
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    items(COOKING_TIPS) { tip ->
                        TipCard(tip = tip)
                    }
                }

                Spacer(Modifier.height(30.dp))
            }
        }
    }
}

// ── Hero Search Section ───────────────────────────────────────────────────────

private const val HERO_BG_URL =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"

@Composable
private fun HeroSearchSection(
    query: String,
    onQueryChange: (String) -> Unit,
    onSearch: (String) -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(220.dp),
    ) {
        // ── Background food image ─────────────────────────────────────────
        AsyncImage(
            model = HERO_BG_URL,
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
        )

        // ── Dark + brand colour overlay for readability ───────────────────
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color.Black.copy(alpha = 0.45f),
                            Color.Black.copy(alpha = 0.72f),
                        ),
                    )
                ),
        )

        // ── Thin orange accent line at the bottom ─────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(3.dp)
                .background(
                    brush = Brush.horizontalGradient(
                        listOf(Primary, PrimaryDark, Primary),
                    )
                )
                .align(Alignment.BottomStart),
        )

        // ── Content ───────────────────────────────────────────────────────
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                "What are you craving?",
                color = Color.White,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                "Enter ingredients to find perfect recipes",
                color = Color.White.copy(alpha = 0.75f),
                fontSize = 14.sp,
            )
            Spacer(Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                // Input
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(52.dp)
                        .background(
                            Color.Black.copy(alpha = 0.45f),
                            RoundedCornerShape(16.dp),
                        )
                        .border(
                            width = 1.dp,
                            color = Color.White.copy(alpha = 0.25f),
                            shape = RoundedCornerShape(16.dp),
                        )
                        .padding(horizontal = 16.dp),
                    contentAlignment = Alignment.CenterStart,
                ) {
                    BasicTextField(
                        value = query,
                        onValueChange = onQueryChange,
                        modifier = Modifier.fillMaxWidth(),
                        textStyle = TextStyle(color = Color.White, fontSize = 16.sp),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                        keyboardActions = KeyboardActions(onSearch = { onSearch(query) }),
                        decorationBox = { inner ->
                            if (query.isEmpty()) {
                                Text(
                                    "e.g., chicken, rice, tomatoes...",
                                    color = Color.White.copy(alpha = 0.5f),
                                    fontSize = 14.sp,
                                )
                            }
                            inner()
                        },
                    )
                }
                // Find button
                Box(
                    modifier = Modifier
                        .height(52.dp)
                        .width(72.dp)
                        .background(
                            brush = Brush.linearGradient(listOf(Primary, PrimaryDark)),
                            shape = RoundedCornerShape(16.dp),
                        )
                        .clickable(
                            indication = null,
                            interactionSource = remember { MutableInteractionSource() },
                        ) { onSearch(query) },
                    contentAlignment = Alignment.Center,
                ) {
                    Text("Find", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
            }
        }
    }
}

// ── Section Header ────────────────────────────────────────────────────────────

@Composable
private fun SectionHeader(
    title: String,
    subtitle: String,
    showSeeAll: Boolean = true,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 0.dp)
            .padding(bottom = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column {
            Text(title, color = OnBackground, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text(subtitle, color = TextSecondary, fontSize = 12.sp)
        }
        if (showSeeAll) {
            Text("See All →", color = Primary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

// ── World Cuisines Grid ───────────────────────────────────────────────────────

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun WorldCuisinesGrid(onCuisineClick: (String) -> Unit) {
    FlowRow(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        maxItemsInEachRow = 5,
    ) {
        WORLD_CUISINES.forEach { cuisine ->
            CuisineCircle(cuisine = cuisine, onClick = { onCuisineClick(cuisine.query) })
        }
    }
}

@Composable
private fun CuisineCircle(cuisine: WorldCuisine, onClick: () -> Unit) {
    var pressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.9f else 1f,
        animationSpec = spring(),
        label = "scale",
    )

    Column(
        modifier = Modifier
            .padding(4.dp)
            .scale(scale)
            .clip(RoundedCornerShape(20.dp))
            .background(cuisine.color.copy(alpha = 0.15f))
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = {
                        pressed = true
                        tryAwaitRelease()
                        pressed = false
                    },
                    onTap = { onClick() },
                )
            }
            .padding(vertical = 10.dp, horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(cuisine.flag, fontSize = 28.sp)
        Spacer(Modifier.height(4.dp))
        Text(cuisine.name, color = cuisine.color, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
    }
}

// ── Trending Card ─────────────────────────────────────────────────────────────

@Composable
private fun TrendingCard(recipe: Recipe, onClick: () -> Unit) {
    var pressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.95f else 1f,
        animationSpec = spring(),
        label = "scale",
    )

    Box(
        modifier = Modifier
            .scale(scale)
            .size(width = 260.dp, height = 200.dp)
            .clip(RoundedCornerShape(20.dp))
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = {
                        pressed = true
                        tryAwaitRelease()
                        pressed = false
                    },
                    onTap = { onClick() },
                )
            },
    ) {
        AsyncImage(
            model = recipe.image,
            contentDescription = recipe.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
        )
        // Gradient overlay
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.9f)),
                    )
                ),
        )
        // Rating badge
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(12.dp)
                .background(Primary, RoundedCornerShape(12.dp))
                .padding(horizontal = 8.dp, vertical = 4.dp),
        ) {
            val score = recipe.spoonacularScore?.let { "%.0f".format(it) } ?: "—"
            Text("⭐ $score", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
        // Bottom info
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(16.dp),
        ) {
            Text(
                recipe.title,
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                if (recipe.readyInMinutes != null) {
                    Text("⏱ ${recipe.readyInMinutes} min", color = Color.White, fontSize = 11.sp)
                }
                if (recipe.cuisines.isNotEmpty()) {
                    Text(recipe.cuisines.first(), color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp)
                }
            }
        }
    }
}

// ── Quick Bite Card ───────────────────────────────────────────────────────────

@Composable
private fun QuickBiteCard(recipe: Recipe, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(180.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Surface)
            .clickable(onClick = onClick),
    ) {
        Box {
            AsyncImage(
                model = recipe.image,
                contentDescription = recipe.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp),
            )
            // Badge
            if (recipe.dishTypes.isNotEmpty()) {
                Box(
                    modifier = Modifier
                        .padding(8.dp)
                        .background(Primary, RoundedCornerShape(12.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                ) {
                    Text(recipe.dishTypes.first().replaceFirstChar { it.uppercase() },
                        color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
        Column(modifier = Modifier.padding(10.dp)) {
            Text(
                recipe.title,
                color = OnBackground,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                if (recipe.readyInMinutes != null)
                    Text("⏱ ${recipe.readyInMinutes} min", color = TextSecondary, fontSize = 10.sp)
            }
        }
    }
}

// ── Seasonal Card ─────────────────────────────────────────────────────────────

@Composable
private fun SeasonalCard(recipe: Recipe, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(width = 200.dp, height = 160.dp)
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
    ) {
        AsyncImage(
            model = recipe.image,
            contentDescription = recipe.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.8f)),
                    )
                ),
        )
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(12.dp),
        ) {
            Box(
                modifier = Modifier
                    .background(Primary, RoundedCornerShape(12.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp),
            ) {
                val cuisine = recipe.cuisines.firstOrNull() ?: "Seasonal"
                Text(cuisine, color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(4.dp))
            Text(
                recipe.title,
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

// ── Chef Card ─────────────────────────────────────────────────────────────────

@Composable
private fun ChefCard(recipe: Recipe, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(width = 240.dp, height = 180.dp)
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
    ) {
        AsyncImage(
            model = recipe.image,
            contentDescription = recipe.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.9f)),
                    )
                ),
        )
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(12.dp),
        ) {
            Text(
                recipe.title,
                color = Color.White,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text("by Chef", color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp)
            Spacer(Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (recipe.readyInMinutes != null) {
                    Box(
                        modifier = Modifier
                            .background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("⏱ ${recipe.readyInMinutes} min", color = Color.White, fontSize = 10.sp)
                    }
                }
                if (recipe.spoonacularScore != null) {
                    Text("⭐ ${"%.0f".format(recipe.spoonacularScore)}", color = Color.White, fontSize = 10.sp)
                }
            }
        }
    }
}

// ── Health Card ───────────────────────────────────────────────────────────────

@Composable
private fun HealthCard(recipe: Recipe, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(200.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Surface)
            .clickable(onClick = onClick),
    ) {
        AsyncImage(
            model = recipe.image,
            contentDescription = recipe.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp),
        )
        Column(modifier = Modifier.padding(10.dp)) {
            Text(
                recipe.title,
                color = OnBackground,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(6.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                if (recipe.readyInMinutes != null)
                    Text("⏱ ${recipe.readyInMinutes} min", color = TextSecondary, fontSize = 10.sp)
                if (recipe.servings != null)
                    Text("🍽 ${recipe.servings}", color = TextSecondary, fontSize = 10.sp)
            }
        }
    }
}

// ── Dessert Card ──────────────────────────────────────────────────────────────

@Composable
private fun DessertCard(recipe: Recipe, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(width = 180.dp, height = 160.dp)
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
    ) {
        AsyncImage(
            model = recipe.image,
            contentDescription = recipe.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.7f)),
                    )
                ),
        )
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(10.dp),
        ) {
            Text(
                recipe.title,
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (recipe.readyInMinutes != null)
                    Text("⏱ ${recipe.readyInMinutes} min", color = Color.White, fontSize = 10.sp)
            }
        }
    }
}

// ── Comfort Card ──────────────────────────────────────────────────────────────

@Composable
private fun ComfortCard(recipe: Recipe, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(width = 200.dp, height = 160.dp)
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
    ) {
        AsyncImage(
            model = recipe.image,
            contentDescription = recipe.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .align(Alignment.BottomStart)
                .background(Color.Black.copy(alpha = 0.5f)),
        )
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(12.dp),
        ) {
            Text("😌 Cozy", color = Primary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Text(
                recipe.title,
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            if (recipe.readyInMinutes != null)
                Text("⏱ ${recipe.readyInMinutes} min", color = Color.White.copy(alpha = 0.8f), fontSize = 10.sp)
        }
    }
}

// ── Date Night Card ───────────────────────────────────────────────────────────

@Composable
private fun DateNightCard(recipe: Recipe, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(width = 220.dp, height = 160.dp)
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
    ) {
        AsyncImage(
            model = recipe.image,
            contentDescription = recipe.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Primary.copy(alpha = 0.9f)),
                    )
                ),
        )
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(12.dp),
        ) {
            Text("💕 Romantic", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Text(
                recipe.title,
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            if (recipe.readyInMinutes != null)
                Text("⏱ ${recipe.readyInMinutes} min", color = Color.White, fontSize = 10.sp)
        }
    }
}

// ── Breakfast Card ────────────────────────────────────────────────────────────

@Composable
private fun BreakfastCard(recipe: Recipe, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(180.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Surface)
            .clickable(onClick = onClick),
    ) {
        AsyncImage(
            model = recipe.image,
            contentDescription = recipe.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp),
        )
        Column(modifier = Modifier.padding(10.dp)) {
            Text("☀️ Morning", color = Primary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Text(
                recipe.title,
                color = OnBackground,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(4.dp))
            if (recipe.readyInMinutes != null)
                Text("⏱ ${recipe.readyInMinutes} min", color = TextSecondary, fontSize = 10.sp)
        }
    }
}

// ── Vegan Card ────────────────────────────────────────────────────────────────

@Composable
private fun VeganCard(recipe: Recipe, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(160.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Surface)
            .clickable(onClick = onClick),
    ) {
        Box {
            AsyncImage(
                model = recipe.image,
                contentDescription = recipe.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp),
            )
            Box(
                modifier = Modifier
                    .padding(8.dp)
                    .background(Color(0xFF4ADE80), RoundedCornerShape(12.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp),
            ) {
                Text("🌱 Vegan", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            }
        }
        Column(modifier = Modifier.padding(8.dp)) {
            Text(
                recipe.title,
                color = OnBackground,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(4.dp))
            if (recipe.readyInMinutes != null)
                Text("⏱ ${recipe.readyInMinutes} min", color = TextSecondary, fontSize = 10.sp)
        }
    }
}

// ── Drink Card ────────────────────────────────────────────────────────────────

@Composable
private fun DrinkCard(recipe: Recipe, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(160.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Surface)
            .clickable(onClick = onClick),
    ) {
        AsyncImage(
            model = recipe.image,
            contentDescription = recipe.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp),
        )
        Column(modifier = Modifier.padding(10.dp)) {
            Text("🍹 Refreshing", color = Primary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Text(
                recipe.title,
                color = OnBackground,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(4.dp))
            if (recipe.readyInMinutes != null)
                Text("⏱ ${recipe.readyInMinutes} min", color = TextSecondary, fontSize = 10.sp)
        }
    }
}

// ── Budget Card ───────────────────────────────────────────────────────────────

@Composable
private fun BudgetCard(recipe: Recipe, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(180.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Surface)
            .clickable(onClick = onClick),
    ) {
        AsyncImage(
            model = recipe.image,
            contentDescription = recipe.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp),
        )
        Column(modifier = Modifier.padding(10.dp)) {
            Text("💰 Budget-friendly", color = Primary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Text(
                recipe.title,
                color = OnBackground,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(4.dp))
            if (recipe.readyInMinutes != null)
                Text("⏱ ${recipe.readyInMinutes} min", color = TextSecondary, fontSize = 10.sp)
        }
    }
}

// ── Kids Card ─────────────────────────────────────────────────────────────────

@Composable
private fun KidsCard(recipe: Recipe, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(width = 200.dp, height = 160.dp)
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
    ) {
        AsyncImage(
            model = recipe.image,
            contentDescription = recipe.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.5f)),
        )
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(12.dp),
        ) {
            Text("👶 Kid-approved", color = Primary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Text(
                recipe.title,
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            if (recipe.readyInMinutes != null)
                Text("⏱ ${recipe.readyInMinutes} min", color = Color.White.copy(alpha = 0.8f), fontSize = 10.sp)
        }
    }
}

// ── Tip Card ──────────────────────────────────────────────────────────────────

@Composable
private fun TipCard(tip: CookingTip) {
    Row(
        modifier = Modifier
            .background(Surface, RoundedCornerShape(25.dp))
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(tip.emoji, fontSize = 18.sp)
        Text(tip.tip, color = OnBackground, fontSize = 13.sp)
    }
}

package com.flavorfind.app.core.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.flavorfind.app.ui.detail.RecipeDetailScreen
import com.flavorfind.app.ui.home.HomeScreen
import com.flavorfind.app.ui.recipes.RecipesScreen
import com.flavorfind.app.ui.search.SearchResultsScreen
import com.flavorfind.app.ui.settings.SettingsScreen
import com.flavorfind.app.ui.splash.SplashScreen

// ── Route constants ───────────────────────────────────────────────────────────

object Routes {
    const val SPLASH   = "splash"
    const val HOME     = "home"
    const val RECIPES  = "recipes"
    const val SETTINGS = "settings"
    const val DETAIL   = "detail/{recipeId}"
    const val SEARCH   = "search/{ingredients}"

    fun detail(recipeId: Int) = "detail/$recipeId"
    fun search(ingredients: String) = "search/${java.net.URLEncoder.encode(ingredients, "UTF-8")}"
}

// ── Bottom nav destinations ───────────────────────────────────────────────────

sealed class BottomNavDest(
    val route: String,
    val label: String,
) {
    data object Home     : BottomNavDest(Routes.HOME,     "Home")
    data object Recipes  : BottomNavDest(Routes.RECIPES,  "Recipes")
    data object Settings : BottomNavDest(Routes.SETTINGS, "Settings")

    companion object {
        val all = listOf(Home, Recipes, Settings)
    }
}

// ── Nav graph ─────────────────────────────────────────────────────────────────

@Composable
fun FlavorFindNavGraph(
    navController: NavHostController,
    modifier: Modifier = Modifier,
) {
    NavHost(
        navController    = navController,
        startDestination = Routes.SPLASH,
        modifier         = modifier,
    ) {
        composable(Routes.SPLASH) {
            SplashScreen(
                onFinished = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.SPLASH) { inclusive = true }
                    }
                }
            )
        }
        composable(Routes.HOME) {
            HomeScreen(
                onRecipeClick = { id -> navController.navigate(Routes.detail(id)) },
                onSearchIngredients = { ingredients -> navController.navigate(Routes.search(ingredients)) }
            )
        }
        composable(Routes.RECIPES) {
            RecipesScreen(
                onRecipeClick = { id -> navController.navigate(Routes.detail(id)) }
            )
        }
        composable(Routes.SETTINGS) {
            SettingsScreen()
        }
        composable(
            route = Routes.DETAIL,
            arguments = listOf(navArgument("recipeId") { type = NavType.IntType }),
        ) { backStack ->
            val id = backStack.arguments?.getInt("recipeId") ?: return@composable
            RecipeDetailScreen(
                recipeId  = id,
                onBack    = { navController.popBackStack() },
            )
        }
        composable(
            route = Routes.SEARCH,
            arguments = listOf(navArgument("ingredients") { type = NavType.StringType }),
        ) { backStack ->
            val ingredients = backStack.arguments?.getString("ingredients") ?: return@composable
            SearchResultsScreen(
                ingredients = ingredients,
                onRecipeClick = { id -> navController.navigate(Routes.detail(id)) },
                onBack = { navController.popBackStack() },
            )
        }
    }
}

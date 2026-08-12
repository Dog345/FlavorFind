package com.flavorfind.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.sp
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.flavorfind.app.core.navigation.BottomNavDest
import com.flavorfind.app.core.navigation.FlavorFindNavGraph
import com.flavorfind.app.core.navigation.Routes
import com.flavorfind.app.core.theme.Background
import com.flavorfind.app.core.theme.FlavorFindTheme
import com.flavorfind.app.core.theme.Primary
import com.flavorfind.app.core.theme.Surface
import com.flavorfind.app.core.theme.TextSecondary
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            FlavorFindTheme {
                val navController = rememberNavController()
                AppScaffold(navController)
            }
        }
    }
}

// ── App scaffold with bottom nav ──────────────────────────────────────────────

@Composable
private fun AppScaffold(navController: NavHostController) {
    val navBackStack by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStack?.destination?.route

    // Hide bottom bar on splash, detail, and search screens
    val showBottomBar = currentRoute != Routes.SPLASH &&
            currentRoute != Routes.DETAIL &&
            currentRoute != Routes.SEARCH &&
            !currentRoute.orEmpty().startsWith("detail/") &&
            !currentRoute.orEmpty().startsWith("search/")

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = Background,
        bottomBar = {
            if (showBottomBar) {
                FlavorFindBottomBar(
                    currentRoute = currentRoute,
                    onNavigate   = { dest ->
                        navController.navigate(dest.route) {
                            popUpTo(Routes.HOME) { saveState = true }
                            launchSingleTop = true
                            restoreState    = true
                        }
                    },
                )
            }
        },
    ) { innerPadding ->
        FlavorFindNavGraph(
            navController = navController,
            modifier      = Modifier.padding(innerPadding),
        )
    }
}

// ── Bottom navigation bar ─────────────────────────────────────────────────────

private data class NavItemConfig(
    val dest: BottomNavDest,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
)

private val navItems = listOf(
    NavItemConfig(BottomNavDest.Home,     Icons.Filled.Home,     Icons.Outlined.Home),
    NavItemConfig(BottomNavDest.Recipes,  Icons.Filled.Search,   Icons.Outlined.Search),
    NavItemConfig(BottomNavDest.Settings, Icons.Filled.Settings, Icons.Outlined.Settings),
)

@Composable
private fun FlavorFindBottomBar(
    currentRoute: String?,
    onNavigate: (BottomNavDest) -> Unit,
) {
    NavigationBar(
        containerColor = Surface,
        tonalElevation = androidx.compose.ui.unit.Dp.Unspecified,
    ) {
        navItems.forEach { item ->
            val selected = currentRoute == item.dest.route
            NavigationBarItem(
                selected = selected,
                onClick  = { onNavigate(item.dest) },
                icon = {
                    Icon(
                        imageVector = if (selected) item.selectedIcon else item.unselectedIcon,
                        contentDescription = item.dest.label,
                    )
                },
                label = {
                    Text(item.dest.label, fontSize = 10.sp)
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor   = Primary,
                    selectedTextColor   = Primary,
                    unselectedIconColor = TextSecondary,
                    unselectedTextColor = TextSecondary,
                    indicatorColor      = Color.Transparent,
                ),
            )
        }
    }
}

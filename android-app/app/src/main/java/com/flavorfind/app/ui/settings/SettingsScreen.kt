package com.flavorfind.app.ui.settings

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.flavorfind.app.core.theme.Background
import com.flavorfind.app.core.theme.Error
import com.flavorfind.app.core.theme.OnBackground
import com.flavorfind.app.core.theme.Primary
import com.flavorfind.app.core.theme.PrimaryDark
import com.flavorfind.app.core.theme.Surface
import com.flavorfind.app.core.theme.SurfaceVariant
import com.flavorfind.app.core.theme.TextSecondary
import com.flavorfind.app.data.repository.AppSettings
import com.flavorfind.app.data.repository.AppStats

// ── Entry point ───────────────────────────────────────────────────────────────

@Composable
fun SettingsScreen(
    vm: SettingsViewModel = hiltViewModel(),
) {
    val persistedSettings by vm.settings.collectAsStateWithLifecycle()
    val draft             by vm.draft.collectAsStateWithLifecycle()
    val stats             by vm.stats.collectAsStateWithLifecycle()
    val ui                by vm.ui.collectAsStateWithLifecycle()

    val s = draft ?: persistedSettings

    val snackbarHostState = remember { SnackbarHostState() }
    val context = androidx.compose.ui.platform.LocalContext.current

    LaunchedEffect(ui.savedSnackbar) {
        if (ui.savedSnackbar) {
            snackbarHostState.showSnackbar("Settings saved successfully")
            vm.dismissSnackbar()
        }
    }

    var showClearDialog by remember { mutableStateOf(false) }

    fun openWebsite(path: String) {
        val intent = android.content.Intent(android.content.Intent.ACTION_VIEW).apply {
            data = android.net.Uri.parse("https://flavorfind.dallah.co.ke/$path")
        }
        context.startActivity(intent)
    }

    Box(modifier = Modifier.fillMaxSize()) {

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(Background),
        ) {
            // ── Header ────────────────────────────────────────────────────────
            item {
                Column(
                    modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 20.dp, bottom = 4.dp)
                ) {
                    Text(
                        text       = "Settings",
                        color      = OnBackground,
                        fontSize   = 26.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text     = "Customize your FlavorFind experience",
                        color    = TextSecondary,
                        fontSize = 13.sp,
                    )
                }
            }

            // ── Preferences ───────────────────────────────────────────────────
            item {
                SettingsSection(title = "Preferences") {
                    ToggleItem(
                        icon     = "🔔",
                        label    = "Notifications",
                        subtitle = "Recipe tips and updates",
                        checked  = s.notifications,
                        onCheckedChange = vm::setNotifications,
                    )
                    SettingsDivider()
                    ToggleItem(
                        icon    = "📌",
                        label   = "Auto-save viewed recipes",
                        checked = s.autoSave,
                        onCheckedChange = vm::setAutoSave,
                    )
                    SettingsDivider()
                    ToggleItem(
                        icon    = "📊",
                        label   = "Show nutrition info",
                        checked = s.showNutrition,
                        onCheckedChange = vm::setShowNutrition,
                        isLast  = true,
                    )
                }
            }

            // ── Default Servings ──────────────────────────────────────────────
            item {
                SettingsSection(title = "Default Servings") {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text("👤", fontSize = 20.sp)
                        Spacer(Modifier.width(12.dp))
                        Text(
                            "Servings per recipe",
                            color      = OnBackground,
                            fontSize   = 14.sp,
                            fontWeight = FontWeight.Medium,
                            modifier   = Modifier.weight(1f),
                        )
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(SurfaceVariant)
                                .clickable(onClick = vm::decrementServings),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text("−", color = OnBackground, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        }
                        Text(
                            text       = "${s.defaultServings}",
                            color      = OnBackground,
                            fontSize   = 18.sp,
                            fontWeight = FontWeight.Bold,
                            modifier   = Modifier.padding(horizontal = 16.dp),
                        )
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Brush.horizontalGradient(listOf(Primary, PrimaryDark))),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                "+",
                                color      = Color.White,
                                fontSize   = 18.sp,
                                fontWeight = FontWeight.Bold,
                                modifier   = Modifier.clickable(onClick = vm::incrementServings),
                            )
                        }
                    }
                }
            }

            // ── Dietary Preferences ───────────────────────────────────────────
            item {
                SettingsSection(title = "Dietary Preferences") {
                    ToggleItem(icon = "🥗", label = "Vegetarian", checked = s.vegetarian, onCheckedChange = vm::setVegetarian)
                    SettingsDivider()
                    ToggleItem(icon = "🌱", label = "Vegan",       checked = s.vegan,       onCheckedChange = vm::setVegan)
                    SettingsDivider()
                    ToggleItem(icon = "🌾", label = "Gluten Free", checked = s.glutenFree,  onCheckedChange = vm::setGlutenFree)
                    SettingsDivider()
                    ToggleItem(icon = "🥛", label = "Dairy Free",  checked = s.dairyFree,   onCheckedChange = vm::setDairyFree, isLast = true)
                }
            }

            // ── Stats ─────────────────────────────────────────────────────────
            item { StatsSection(stats = stats) }

            // ── Data ──────────────────────────────────────────────────────────
            item {
                SettingsSection(title = "Data") {
                    RowItem(
                        icon     = "🗂️",
                        label    = "Clear cache",
                        subtitle = "Remove saved recipes and stats",
                        onClick  = { showClearDialog = true },
                    )
                    SettingsDivider()
                    RowItem(
                        icon     = "📤",
                        label    = "Export saved recipes",
                        subtitle = "Coming soon",
                        isLast   = true,
                        onClick  = { vm.showComingSoon("Export Saved Recipes\n\nExport your saved recipes to share or back up.") },
                    )
                }
            }

            // ── Support ───────────────────────────────────────────────────────
            item {
                SettingsSection(title = "Contact & Support") {
                    RowItem(
                        icon     = "✉️",
                        label    = "Email us",
                        subtitle = "dallaherick0@gmail.com",
                        onClick  = { vm.showComingSoon("Email Support\n\nDirect email support is coming soon.") },
                    )
                    SettingsDivider()
                    RowItem(
                        icon     = "💬",
                        label    = "Live Chat",
                        subtitle = "Get help instantly",
                        onClick  = { vm.showComingSoon("Live Chat\n\nLive chat support is coming soon.") },
                    )
                    SettingsDivider()
                    RowItem(
                        icon     = "𝕏",
                        label    = "Twitter / X",
                        subtitle = "@flavorfind",
                        isLast   = true,
                        onClick  = { vm.showComingSoon("Twitter / X\n\nFollow us for updates and tips.") },
                    )
                }
            }

            // ── About ─────────────────────────────────────────────────────────
            item {
                SettingsSection(title = "About") {
                    RowItem(
                        icon     = "📱",
                        label    = "Version",
                        trailing = { Text("1.0.0", color = TextSecondary, fontSize = 13.sp) },
                    )
                    SettingsDivider()
                    RowItem(
                        icon    = "🌐",
                        label   = "Visit our website",
                        subtitle = "flavorfind.dallah.co.ke",
                        onClick = { openWebsite("") },
                    )
                    SettingsDivider()
                    RowItem(
                        icon    = "🔒",
                        label   = "Privacy Policy",
                        onClick = { openWebsite("#privacy-page") },
                    )
                    SettingsDivider()
                    RowItem(
                        icon    = "📋",
                        label   = "Terms of Service",
                        onClick = { openWebsite("#terms-page") },
                    )
                    SettingsDivider()
                    RowItem(
                        icon    = "📧",
                        label   = "Contact Us",
                        isLast  = true,
                        onClick = { openWebsite("#contact-page") },
                    )
                }
            }

            // ── Save button ───────────────────────────────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 24.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Brush.horizontalGradient(listOf(Primary, PrimaryDark)))
                        .clickable(onClick = vm::saveSettings)
                        .padding(vertical = 16.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("Save Settings", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }

            item { Spacer(Modifier.height(32.dp)) }
        }

        // ── Snackbar ──────────────────────────────────────────────────────────
        SnackbarHost(
            hostState = snackbarHostState,
            modifier  = Modifier.align(Alignment.BottomCenter),
        ) { data ->
            Snackbar(
                snackbarData   = data,
                containerColor = Color(0xFF1A4731),
                contentColor   = Color.White,
            )
        }

        // ── Coming Soon modal ─────────────────────────────────────────────────
        AnimatedVisibility(
            visible = ui.comingSoonFeature != null,
            enter   = fadeIn(),
            exit    = fadeOut(),
        ) {
            ComingSoonModal(
                feature   = ui.comingSoonFeature ?: "",
                onDismiss = vm::dismissComingSoon,
            )
        }
    }

    // ── Clear cache dialog ────────────────────────────────────────────────────
    if (showClearDialog) {
        AlertDialog(
            onDismissRequest  = { showClearDialog = false },
            containerColor    = Surface,
            shape             = RoundedCornerShape(20.dp),
            title = { Text("Clear Cache", color = OnBackground, fontWeight = FontWeight.Bold) },
            text  = { Text("This will remove saved recipes and stats.", color = TextSecondary) },
            confirmButton = {
                TextButton(onClick = { vm.clearCache(); showClearDialog = false }) {
                    Text("Clear", color = Error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            },
        )
    }
}

// ── Section wrapper ───────────────────────────────────────────────────────────

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable () -> Unit,
) {
    Column {
        Text(
            text          = title.uppercase(),
            color         = TextSecondary,
            fontSize      = 11.sp,
            fontWeight    = FontWeight.Bold,
            letterSpacing = 1.2.sp,
            modifier      = Modifier.padding(start = 16.dp, end = 16.dp, top = 20.dp, bottom = 8.dp),
        )
        Column(
            modifier = Modifier
                .padding(horizontal = 16.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Surface),
        ) {
            content()
        }
    }
}

// ── Toggle row ────────────────────────────────────────────────────────────────

@Composable
private fun ToggleItem(
    icon: String,
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    subtitle: String? = null,
    isLast: Boolean = false,
) {
    RowItem(
        icon     = icon,
        label    = label,
        subtitle = subtitle,
        isLast   = isLast,
        trailing = {
            Switch(
                checked         = checked,
                onCheckedChange = onCheckedChange,
                colors = SwitchDefaults.colors(
                    checkedThumbColor   = Color.White,
                    checkedTrackColor   = Primary,
                    uncheckedThumbColor = TextSecondary,
                    uncheckedTrackColor = SurfaceVariant,
                ),
            )
        },
    )
}

// ── Generic row item ──────────────────────────────────────────────────────────

@Composable
private fun RowItem(
    icon: String,
    label: String,
    subtitle: String? = null,
    isLast: Boolean = false,
    onClick: (() -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(icon, fontSize = 20.sp)
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(label, color = OnBackground, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            if (subtitle != null) {
                Text(subtitle, color = TextSecondary, fontSize = 11.sp)
            }
        }
        when {
            trailing != null -> trailing()
            onClick != null  -> Icon(
                Icons.Default.KeyboardArrowRight,
                contentDescription = null,
                tint     = TextSecondary,
                modifier = Modifier.size(18.dp),
            )
        }
    }
}

// ── Divider ───────────────────────────────────────────────────────────────────

@Composable
private fun SettingsDivider() {
    HorizontalDivider(
        modifier  = Modifier.padding(start = 48.dp),
        thickness = 0.5.dp,
        color     = SurfaceVariant,
    )
}

// ── Stats section ─────────────────────────────────────────────────────────────

@Composable
private fun StatsSection(stats: AppStats) {
    Column {
        Text(
            text          = "YOUR STATS",
            color         = TextSecondary,
            fontSize      = 11.sp,
            fontWeight    = FontWeight.Bold,
            letterSpacing = 1.2.sp,
            modifier      = Modifier.padding(start = 16.dp, end = 16.dp, top = 20.dp, bottom = 8.dp),
        )
        Row(
            modifier              = Modifier.padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            StatCard("👁",  "Viewed",   "${stats.recipesViewed}", Modifier.weight(1f))
            StatCard("♥",  "Saved",    "${stats.savedCount}",    Modifier.weight(1f))
            StatCard("⌕",  "Searches", "${stats.searchesDone}",  Modifier.weight(1f))
        }
    }
}

@Composable
private fun StatCard(icon: String, label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier            = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(Surface)
            .padding(vertical = 14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(icon, fontSize = 22.sp, color = OnBackground)
        Spacer(Modifier.height(6.dp))
        Text(value, color = Primary,       fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(2.dp))
        Text(label, color = TextSecondary, fontSize = 11.sp, textAlign = TextAlign.Center)
    }
}

// ── Coming Soon modal ─────────────────────────────────────────────────────────

@Composable
private fun ComingSoonModal(feature: String, onDismiss: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.75f))
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication        = null,
                onClick           = onDismiss,
            ),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .padding(horizontal = 32.dp)
                .clip(RoundedCornerShape(28.dp))
                .background(Brush.linearGradient(listOf(Primary, PrimaryDark)))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication        = null,
                    onClick           = {},
                )
                .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text("🍽️", fontSize = 52.sp)
            Spacer(Modifier.height(12.dp))
            Text(
                "Coming Soon",
                color      = Color.White,
                fontSize   = 22.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text      = feature,
                color     = Color.White.copy(alpha = 0.85f),
                fontSize  = 14.sp,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(16.dp))
            Text(
                "We're working hard to bring you this feature. Stay tuned!",
                color     = Color.White.copy(alpha = 0.7f),
                fontSize  = 13.sp,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(20.dp))
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(30.dp))
                    .background(Color.White)
                    .clickable(onClick = onDismiss)
                    .padding(horizontal = 28.dp, vertical = 12.dp),
            ) {
                Text("Got it", color = Primary, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
        }
    }
}

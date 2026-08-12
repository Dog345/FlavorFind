package com.flavorfind.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.flavorfind.app.core.theme.OnBackground
import com.flavorfind.app.core.theme.Primary
import com.flavorfind.app.core.theme.Surface
import com.flavorfind.app.core.theme.SurfaceVariant
import com.flavorfind.app.core.theme.TextSecondary
import com.flavorfind.app.domain.model.Recipe

private const val FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"

@Composable
fun RecipeCard(
    recipe: Recipe,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Surface)
            .clickable(onClick = onClick),
        verticalAlignment = Alignment.Top,
    ) {
        // Thumbnail
        AsyncImage(
            model             = recipe.image.ifBlank { FALLBACK_IMAGE },
            contentDescription = recipe.title,
            contentScale      = ContentScale.Crop,
            modifier          = Modifier
                .size(width = 100.dp, height = 110.dp)
                .clip(RoundedCornerShape(topStart = 12.dp, bottomStart = 12.dp)),
        )

        // Content
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 10.dp, vertical = 10.dp),
        ) {
            Text(
                text       = recipe.title,
                color      = OnBackground,
                fontSize   = 14.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines   = 2,
                overflow   = TextOverflow.Ellipsis,
            )

            Spacer(Modifier.height(6.dp))

            // Meta row — time + score
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment     = Alignment.CenterVertically,
            ) {
                if (recipe.readyInMinutes != null) {
                    MetaChip("⏱ ${recipe.readyInMinutes} min")
                }
                if (recipe.spoonacularScore != null) {
                    MetaChip("⭐ ${"%.0f".format(recipe.spoonacularScore)}")
                }
            }

            // Cuisine / type tags
            if (recipe.cuisines.isNotEmpty() || recipe.dishTypes.isNotEmpty()) {
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    (recipe.cuisines.take(1) + recipe.dishTypes.take(1)).forEach { tag ->
                        TagChip(tag)
                    }
                }
            }

            // Ingredients you have
            if (recipe.usedIngredients.isNotEmpty()) {
                Spacer(Modifier.height(6.dp))
                Text("You have:", color = TextSecondary, fontSize = 10.sp)
                Spacer(Modifier.height(2.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    recipe.usedIngredients.take(2).forEach { ing ->
                        IngredientChip(ing.name, owned = true)
                    }
                }
            }

            // Ingredients you're missing
            if (recipe.missedIngredients.isNotEmpty()) {
                Spacer(Modifier.height(4.dp))
                Text("Missing:", color = TextSecondary, fontSize = 10.sp)
                Spacer(Modifier.height(2.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    recipe.missedIngredients.take(2).forEach { ing ->
                        IngredientChip(ing.name, owned = false)
                    }
                    if (recipe.missedIngredients.size > 2) {
                        Text(
                            "+${recipe.missedIngredients.size - 2} more",
                            color    = TextSecondary,
                            fontSize = 9.sp,
                            modifier = Modifier.align(Alignment.CenterVertically),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MetaChip(text: String) {
    Text(text, color = TextSecondary, fontSize = 10.sp)
}

@Composable
private fun TagChip(text: String) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(4.dp))
            .background(SurfaceVariant)
            .padding(horizontal = 6.dp, vertical = 2.dp),
    ) {
        Text(
            text.replaceFirstChar { it.uppercase() },
            color    = TextSecondary,
            fontSize = 9.sp,
        )
    }
}

@Composable
private fun IngredientChip(name: String, owned: Boolean) {
    val bg   = if (owned) Color(0xFF1A4731) else SurfaceVariant
    val text = if (owned) Color(0xFF4ADE80) else TextSecondary
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(4.dp))
            .background(bg)
            .padding(horizontal = 6.dp, vertical = 2.dp),
    ) {
        Text(name, color = text, fontSize = 9.sp)
    }
}

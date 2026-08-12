package com.flavorfind.app.ui.splash

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flavorfind.app.core.theme.Background
import com.flavorfind.app.core.theme.Primary
import com.flavorfind.app.core.theme.PrimaryLight
import com.flavorfind.app.core.theme.Success
import com.flavorfind.app.core.theme.TextSecondary
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun SplashScreen(onFinished: () -> Unit) {
    // Fade-in alpha for the whole screen
    val alpha = remember { Animatable(0f) }

    // Three bouncing dot offsets (negative Y = up)
    val dotOffsets = List(3) { remember { Animatable(0f) } }
    val dotColors  = listOf(Primary, PrimaryLight, Success)

    LaunchedEffect(Unit) {
        // Fade in
        alpha.animateTo(1f, animationSpec = tween(700))

        // Start staggered bouncing — each dot with 180 ms delay
        dotOffsets.forEachIndexed { i, anim ->
            launch {
                delay(i * 180L)
                anim.animateTo(
                    targetValue = -14f,
                    animationSpec = infiniteRepeatable(
                        animation   = tween(600, easing = FastOutSlowInEasing),
                        repeatMode  = RepeatMode.Reverse,
                    ),
                )
            }
        }

        // Navigate after 2.8 s
        delay(2800)
        onFinished()
    }

    Box(
        modifier         = Modifier
            .fillMaxSize()
            .background(Background)
            .alpha(alpha.value),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            // App name — "Flavor" in orange, "Find" in white
            Text(
                text = buildAnnotatedString {
                    withStyle(SpanStyle(color = Primary, fontWeight = FontWeight.Bold, fontSize = 38.sp, letterSpacing = (-0.5).sp)) {
                        append("Flavor")
                    }
                    withStyle(SpanStyle(color = Color.White, fontWeight = FontWeight.Bold, fontSize = 38.sp, letterSpacing = (-0.5).sp)) {
                        append("Find")
                    }
                },
            )

            Spacer(Modifier.height(6.dp))

            Text(
                text  = "Discover recipes you'll love",
                color = TextSecondary,
                fontSize = 14.sp,
            )

            Spacer(Modifier.height(52.dp))

            // Bouncing dots loader
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                dotOffsets.forEachIndexed { i, offset ->
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .offset(y = offset.value.dp)
                            .clip(CircleShape)
                            .background(dotColors[i]),
                    )
                }
            }
        }
    }
}

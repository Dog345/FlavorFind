package com.flavorfind.app.domain.model

data class Recipe(
    val id: Int,
    val title: String,
    val image: String,
    val readyInMinutes: Int?,
    val servings: Int?,
    val spoonacularScore: Double?,
    val summary: String?,
    val cuisines: List<String> = emptyList(),
    val dishTypes: List<String> = emptyList(),
    val extendedIngredients: List<Ingredient> = emptyList(),
    val usedIngredients: List<Ingredient> = emptyList(),
    val missedIngredients: List<Ingredient> = emptyList(),
    val analyzedInstructions: List<AnalyzedInstruction> = emptyList(),
)

data class Ingredient(
    val id: Int = 0,
    val name: String,
    val original: String,
    val amount: Double,
    val unit: String,
    val image: String = "",
)

data class AnalyzedInstruction(
    val name: String = "",
    val steps: List<Step> = emptyList(),
)

data class Step(
    val number: Int,
    val step: String,
    val ingredients: List<StepIngredient> = emptyList(),
)

data class StepIngredient(
    val id: Int,
    val name: String,
    val image: String = "",
)

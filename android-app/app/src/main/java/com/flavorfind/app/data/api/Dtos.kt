package com.flavorfind.app.data.api

import com.flavorfind.app.domain.model.AnalyzedInstruction
import com.flavorfind.app.domain.model.Ingredient
import com.flavorfind.app.domain.model.Recipe
import com.flavorfind.app.domain.model.Step
import com.flavorfind.app.domain.model.StepIngredient
import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

// ── Recipe DTO ────────────────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class RecipeDto(
    @Json(name = "id")                    val id: Int,
    @Json(name = "title")                 val title: String?,
    @Json(name = "image")                 val image: String?,
    @Json(name = "readyInMinutes")        val readyInMinutes: Int?,
    @Json(name = "servings")              val servings: Int?,
    @Json(name = "spoonacularScore")      val spoonacularScore: Double?,
    @Json(name = "summary")              val summary: String?,
    @Json(name = "cuisines")              val cuisines: List<String>?,
    @Json(name = "dishTypes")             val dishTypes: List<String>?,
    @Json(name = "extendedIngredients")   val extendedIngredients: List<IngredientDto>?,
    @Json(name = "usedIngredients")       val usedIngredients: List<IngredientDto>?,
    @Json(name = "missedIngredients")     val missedIngredients: List<IngredientDto>?,
    @Json(name = "analyzedInstructions")  val analyzedInstructions: List<InstructionDto>?,
) {
    fun toDomain() = Recipe(
        id                   = id,
        title                = title ?: "",
        image                = image ?: "",
        readyInMinutes       = readyInMinutes,
        servings             = servings,
        spoonacularScore     = spoonacularScore,
        summary              = summary,
        cuisines             = cuisines ?: emptyList(),
        dishTypes            = dishTypes ?: emptyList(),
        extendedIngredients  = extendedIngredients?.map { it.toDomain() } ?: emptyList(),
        usedIngredients      = usedIngredients?.map { it.toDomain() } ?: emptyList(),
        missedIngredients    = missedIngredients?.map { it.toDomain() } ?: emptyList(),
        analyzedInstructions = analyzedInstructions?.map { it.toDomain() } ?: emptyList(),
    )
}

// ── Ingredient DTO ────────────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class IngredientDto(
    @Json(name = "id")       val id: Int?,
    @Json(name = "name")     val name: String?,
    @Json(name = "original") val original: String?,
    @Json(name = "amount")   val amount: Double?,
    @Json(name = "unit")     val unit: String?,
    @Json(name = "image")    val image: String?,
) {
    fun toDomain() = Ingredient(
        id       = id ?: 0,
        name     = name ?: "",
        original = original ?: "",
        amount   = amount ?: 0.0,
        unit     = unit ?: "",
        image    = image ?: "",
    )
}

// ── Instruction DTOs ──────────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class InstructionDto(
    @Json(name = "name")  val name: String?,
    @Json(name = "steps") val steps: List<StepDto>?,
) {
    fun toDomain() = AnalyzedInstruction(
        name  = name ?: "",
        steps = steps?.map { it.toDomain() } ?: emptyList(),
    )
}

@JsonClass(generateAdapter = true)
data class StepDto(
    @Json(name = "number")      val number: Int?,
    @Json(name = "step")        val step: String?,
    @Json(name = "ingredients") val ingredients: List<StepIngredientDto>?,
) {
    fun toDomain() = Step(
        number      = number ?: 0,
        step        = step ?: "",
        ingredients = ingredients?.map { it.toDomain() } ?: emptyList(),
    )
}

@JsonClass(generateAdapter = true)
data class StepIngredientDto(
    @Json(name = "id")    val id: Int?,
    @Json(name = "name")  val name: String?,
    @Json(name = "image") val image: String?,
) {
    fun toDomain() = StepIngredient(
        id    = id ?: 0,
        name  = name ?: "",
        image = image ?: "",
    )
}

// ── Search result wrapper ─────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class SearchResultDto(
    @Json(name = "results")      val results: List<RecipeDto>?,
    @Json(name = "totalResults") val totalResults: Int?,
    @Json(name = "offset")       val offset: Int?,
    @Json(name = "number")       val number: Int?,
)

// ── Random result wrapper ─────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class RandomResultDto(
    @Json(name = "recipes") val recipes: List<RecipeDto>?,
)

// ── Health DTO ────────────────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class HealthDto(
    @Json(name = "status")    val status: String?,
    @Json(name = "remaining") val remaining: Int?,
    @Json(name = "limit")     val limit: Int?,
    @Json(name = "used")      val used: Int?,
)

// ── Autocomplete DTO ──────────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class AutocompleteDto(
    @Json(name = "name")  val name: String?,
    @Json(name = "image") val image: String?,
    @Json(name = "id")    val id: Int?,
)

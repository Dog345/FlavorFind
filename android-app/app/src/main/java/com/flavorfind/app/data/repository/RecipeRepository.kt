package com.flavorfind.app.data.repository

import com.flavorfind.app.data.api.AutocompleteDto
import com.flavorfind.app.data.api.FlavorFindApi
import com.flavorfind.app.data.api.HealthDto
import com.flavorfind.app.domain.model.Recipe
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RecipeRepository @Inject constructor(
    private val api: FlavorFindApi,
) {
    suspend fun health(): HealthDto =
        api.health()

    suspend fun searchByIngredients(ingredients: String, number: Int = 12): List<Recipe> =
        api.searchByIngredients(ingredients, number).map { it.toDomain() }

    suspend fun searchRecipes(
        query: String? = null,
        cuisine: String? = null,
        diet: String? = null,
        type: String? = null,
        maxReadyTime: Int? = null,
        number: Int = 12,
        offset: Int = 0,
    ): List<Recipe> = api.searchRecipes(query, cuisine, diet, type, maxReadyTime, number, offset)
        .results?.map { it.toDomain() } ?: emptyList()

    suspend fun randomRecipes(number: Int = 10, tags: String? = null): List<Recipe> =
        api.randomRecipes(number, tags).recipes?.map { it.toDomain() } ?: emptyList()

    suspend fun recipeById(id: Int): Recipe =
        api.recipeById(id).toDomain()

    suspend fun autocomplete(query: String): List<AutocompleteDto> =
        api.autocomplete(query)

    suspend fun byCuisine(cuisine: String, number: Int = 12): List<Recipe> =
        api.byCuisine(cuisine, number).results?.map { it.toDomain() } ?: emptyList()

    suspend fun byDiet(diet: String, number: Int = 12): List<Recipe> =
        api.byDiet(diet, number).results?.map { it.toDomain() } ?: emptyList()

    suspend fun byType(type: String, number: Int = 12): List<Recipe> =
        api.byType(type, number).results?.map { it.toDomain() } ?: emptyList()
}

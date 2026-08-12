package com.flavorfind.app.data.api

import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface FlavorFindApi {

    /** GET /api/health */
    @GET("api/health")
    suspend fun health(): HealthDto

    /** GET /api/recipes?ingredients=chicken,tomato&number=12 */
    @GET("api/recipes")
    suspend fun searchByIngredients(
        @Query("ingredients") ingredients: String,
        @Query("number")      number: Int = 12,
    ): List<RecipeDto>

    /** GET /api/recipes/search?query=pasta&cuisine=italian&diet=vegetarian */
    @GET("api/recipes/search")
    suspend fun searchRecipes(
        @Query("query")   query: String? = null,
        @Query("cuisine") cuisine: String? = null,
        @Query("diet")    diet: String? = null,
        @Query("type")    type: String? = null,
        @Query("maxReadyTime") maxReadyTime: Int? = null,
        @Query("number")  number: Int = 12,
        @Query("offset")  offset: Int = 0,
    ): SearchResultDto

    /** GET /api/recipes/random?number=10&tags=vegetarian */
    @GET("api/recipes/random")
    suspend fun randomRecipes(
        @Query("number") number: Int = 10,
        @Query("tags")   tags: String? = null,
    ): RandomResultDto

    /** GET /api/recipes/{id} */
    @GET("api/recipes/{id}")
    suspend fun recipeById(@Path("id") id: Int): RecipeDto

    /** GET /api/ingredients/autocomplete?query=chic */
    @GET("api/ingredients/autocomplete")
    suspend fun autocomplete(@Query("query") query: String): List<AutocompleteDto>

    /** GET /api/categories */
    @GET("api/categories")
    suspend fun categories(): Map<String, Any>

    /** GET /api/categories/cuisine/{cuisine} */
    @GET("api/categories/cuisine/{cuisine}")
    suspend fun byCuisine(
        @Path("cuisine") cuisine: String,
        @Query("number") number: Int = 12,
    ): SearchResultDto

    /** GET /api/categories/diet/{diet} */
    @GET("api/categories/diet/{diet}")
    suspend fun byDiet(
        @Path("diet") diet: String,
        @Query("number") number: Int = 12,
    ): SearchResultDto

    /** GET /api/categories/type/{type} */
    @GET("api/categories/type/{type}")
    suspend fun byType(
        @Path("type") type: String,
        @Query("number") number: Int = 12,
    ): SearchResultDto
}

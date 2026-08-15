<?php

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     title="FlavorFind API",
 *     version="1.0.0",
 *     description="FlavorFind is a smart ingredient pairing and recipe discovery API. It answers: 'I have these ingredients — what else goes well with them, and what can I cook?' Powered by 514,780 recipes and a pre-computed ingredient suggestion engine combining co-occurrence analysis and semantic vector similarity.",
 *     @OA\Contact(email="dallaherick0@gmail.com", name="FlavorFind Support")
 * )
 *
 * @OA\Server(url="https://flavorfind-22iw.onrender.com", description="Production")
 * @OA\Server(url="http://localhost:8000", description="Local development")
 *
 * @OA\Tag(name="Ingredients", description="Search ingredients and get smart pairing suggestions")
 * @OA\Tag(name="Recipes", description="Search and browse 514,780 recipes")
 *
 * @OA\Schema(
 *     schema="Ingredient",
 *     type="object",
 *     @OA\Property(property="id", type="string", format="uuid", example="7bb3db1c-27bf-499e-9945-7ed92bdc16f5"),
 *     @OA\Property(property="name", type="string", example="chicken"),
 *     @OA\Property(property="category", type="string", example="protein")
 * )
 *
 * @OA\Schema(
 *     schema="IngredientWithCount",
 *     type="object",
 *     @OA\Property(property="id", type="string", format="uuid", example="7bb3db1c-27bf-499e-9945-7ed92bdc16f5"),
 *     @OA\Property(property="name", type="string", example="chicken"),
 *     @OA\Property(property="category", type="string", example="protein"),
 *     @OA\Property(property="recipe_count", type="integer", example=5903),
 *     @OA\Property(property="match_rank", type="integer", example=0, description="0=exact, 1=prefix, 2=partial")
 * )
 *
 * @OA\Schema(
 *     schema="Suggestion",
 *     type="object",
 *     @OA\Property(property="id", type="string", format="uuid"),
 *     @OA\Property(property="name", type="string", example="garlic"),
 *     @OA\Property(property="category", type="string", example="vegetable"),
 *     @OA\Property(property="score", type="number", format="float", example=0.6213),
 *     @OA\Property(property="co_occurrence_score", type="number", format="float", example=0.4102),
 *     @OA\Property(property="vector_score", type="number", format="float", example=0.0),
 *     @OA\Property(property="rank", type="integer", example=1)
 * )
 *
 * @OA\Schema(
 *     schema="MultiSuggestion",
 *     type="object",
 *     @OA\Property(property="id", type="string", format="uuid"),
 *     @OA\Property(property="name", type="string", example="onion"),
 *     @OA\Property(property="category", type="string", example="vegetable"),
 *     @OA\Property(property="anchor_matches", type="integer", example=2, description="How many of your input ingredients this pairs well with"),
 *     @OA\Property(property="avg_score", type="number", format="float", example=0.5157),
 *     @OA\Property(property="final_score", type="number", format="float", example=0.6157)
 * )
 *
 * @OA\Schema(
 *     schema="RecipeSummary",
 *     type="object",
 *     @OA\Property(property="id", type="string", format="uuid"),
 *     @OA\Property(property="name", type="string", example="Chicken Pot Pie"),
 *     @OA\Property(property="category", type="string", example="Savory Pies"),
 *     @OA\Property(property="description", type="string"),
 *     @OA\Property(property="prep_time", type="string", example="PT30M"),
 *     @OA\Property(property="cook_time", type="string", example="PT45M"),
 *     @OA\Property(property="total_time", type="string", example="PT1H15M"),
 *     @OA\Property(property="servings", type="integer", example=4),
 *     @OA\Property(property="rating", type="number", format="float", example=4.5),
 *     @OA\Property(property="review_count", type="integer", example=128),
 *     @OA\Property(property="calories", type="number", format="float", example=538.3),
 *     @OA\Property(property="matched_count", type="integer", example=2),
 *     @OA\Property(property="total_searched", type="integer", example=2)
 * )
 *
 * @OA\Schema(
 *     schema="RecipeIngredientItem",
 *     type="object",
 *     @OA\Property(property="id", type="string", format="uuid"),
 *     @OA\Property(property="name", type="string", example="chicken breast"),
 *     @OA\Property(property="category", type="string", example="protein"),
 *     @OA\Property(property="quantity", type="string", example="2"),
 *     @OA\Property(property="quantity_numeric", type="number", example=2.0),
 *     @OA\Property(property="unit", type="string", example="lbs"),
 *     @OA\Property(property="sort_order", type="integer", example=0)
 * )
 *
 * @OA\Schema(
 *     schema="RecipeDetail",
 *     type="object",
 *     @OA\Property(property="id", type="string", format="uuid"),
 *     @OA\Property(property="name", type="string", example="Chicken Pot Pie"),
 *     @OA\Property(property="category", type="string", example="Savory Pies"),
 *     @OA\Property(property="description", type="string"),
 *     @OA\Property(property="prep_time", type="string", example="PT30M"),
 *     @OA\Property(property="cook_time", type="string", example="PT45M"),
 *     @OA\Property(property="total_time", type="string", example="PT1H15M"),
 *     @OA\Property(property="servings", type="integer", example=4),
 *     @OA\Property(property="yield", type="string", example="8 servings"),
 *     @OA\Property(property="rating", type="number", format="float", example=4.5),
 *     @OA\Property(property="review_count", type="integer", example=128),
 *     @OA\Property(property="calories", type="number", format="float", example=538.3),
 *     @OA\Property(property="protein_g", type="number", format="float", example=32.1),
 *     @OA\Property(property="fat_g", type="number", format="float", example=18.4),
 *     @OA\Property(property="carbs_g", type="number", format="float", example=45.2),
 *     @OA\Property(property="fiber_g", type="number", format="float", example=3.1),
 *     @OA\Property(property="sugar_g", type="number", format="float", example=5.0),
 *     @OA\Property(property="sodium_mg", type="number", format="float", example=820.0),
 *     @OA\Property(property="instructions", type="array", @OA\Items(type="string")),
 *     @OA\Property(property="keywords", type="array", @OA\Items(type="string")),
 *     @OA\Property(property="ingredients", type="array", @OA\Items(ref="#/components/schemas/RecipeIngredientItem"))
 * )
 *
 * @OA\Schema(
 *     schema="Pagination",
 *     type="object",
 *     @OA\Property(property="total", type="integer", example=1240),
 *     @OA\Property(property="per_page", type="integer", example=20),
 *     @OA\Property(property="current_page", type="integer", example=1),
 *     @OA\Property(property="last_page", type="integer", example=62)
 * )
 *
 * @OA\Schema(
 *     schema="Error",
 *     type="object",
 *     @OA\Property(property="error", type="string", example="Ingredient not found.")
 * )
 */
abstract class Controller
{
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recipe extends Model
{
    use HasUuids;

    protected $fillable = [
        'source_id', 'name', 'category', 'description',
        'cook_time', 'prep_time', 'total_time', 'servings', 'yield',
        'instructions', 'keywords', 'calories', 'protein_g', 'fat_g',
        'carbs_g', 'fiber_g', 'sugar_g', 'cholesterol_mg', 'sodium_mg',
        'saturated_fat_g', 'rating', 'review_count',
    ];

    protected $casts = [
        'instructions' => 'array',
        'keywords'     => 'array',
        'calories'     => 'float',
        'protein_g'    => 'float',
        'fat_g'        => 'float',
        'carbs_g'      => 'float',
        'fiber_g'      => 'float',
        'sugar_g'      => 'float',
        'cholesterol_mg'  => 'float',
        'sodium_mg'       => 'float',
        'saturated_fat_g' => 'float',
        'rating'          => 'float',
    ];

    public function recipeIngredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class, 'recipe_id');
    }

    public function ingredients()
    {
        return $this->belongsToMany(
            MasterIngredient::class,
            'recipe_ingredients',
            'recipe_id',
            'ingredient_id'
        );
    }

    // Scope: recipes that contain ALL the given ingredient ids
    public function scopeHasAllIngredients($query, array $ingredientIds)
    {
        foreach ($ingredientIds as $id) {
            $query->whereHas('recipeIngredients', function ($q) use ($id) {
                $q->where('ingredient_id', $id);
            });
        }
        return $query;
    }

    // Scope: recipes that contain ANY of the given ingredient ids (ranked by match count)
    public function scopeHasAnyIngredients($query, array $ingredientIds)
    {
        return $query->whereHas('recipeIngredients', function ($q) use ($ingredientIds) {
            $q->whereIn('ingredient_id', $ingredientIds);
        });
    }
}

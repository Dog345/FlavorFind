<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeIngredient extends Model
{
    public $timestamps = false;

    protected $fillable = ['recipe_id', 'ingredient_id', 'quantity', 'unit', 'preparation'];
}

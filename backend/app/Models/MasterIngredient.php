<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterIngredient extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'category',
        'description',
        'allergen_flags',
        'flavor_vector',
    ];

    protected $casts = [
        'allergen_flags' => 'array',
    ];

    public function scopeInCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeWithAllergen($query, string $allergen)
    {
        // PostgreSQL array contains operator
        return $query->whereRaw('? = ANY(allergen_flags)', [$allergen]);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedRecipe extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'recipe_id',
        'collection',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(FlavorFindUser::class, 'user_id');
    }

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class, 'recipe_id');
    }
}

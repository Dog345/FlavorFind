<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SearchHistory extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'ingredient_ids',
        'ingredient_names',
        'result_count',
        'created_at',
    ];

    protected $casts = [
        'ingredient_ids'   => 'array',
        'ingredient_names' => 'array',
        'created_at'       => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(FlavorFindUser::class, 'user_id');
    }
}

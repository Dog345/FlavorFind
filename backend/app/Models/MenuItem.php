<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'base_price',
        'category',
        'image_url',
        'allergen_flags',
        'is_available',
        'sort_order',
    ];

    protected $casts = [
        'base_price'     => 'decimal:2',
        'allergen_flags' => 'array',
        'is_available'   => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function upsellRulesTriggered(): HasMany
    {
        return $this->hasMany(UpsellRule::class, 'trigger_item_id');
    }

    public function upsellRulesSuggested(): HasMany
    {
        return $this->hasMany(UpsellRule::class, 'suggested_item_id');
    }

    /**
     * Scope to only available items.
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    /**
     * Scope to a specific category.
     */
    public function scopeInCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}

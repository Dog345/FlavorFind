<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int         $id
 * @property int         $tenant_id
 * @property int         $category_id
 * @property string      $name
 * @property string|null $description
 * @property string|null $image_url
 * @property float       $base_price     KES (or tenant currency)
 * @property string|null $unit            e.g. "portion", "bottle", "kg"
 * @property bool        $is_available
 * @property bool        $is_active
 * @property int         $prep_time_min  Estimated kitchen prep time in minutes
 * @property array|null  $tags            JSON array of labels, e.g. ["vegan","spicy"]
 * @property int         $sort_order
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class MenuItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'category_id',
        'name',
        'description',
        'image_url',
        'base_price',
        'unit',
        'is_available',
        'is_active',
        'prep_time_min',
        'tags',
        'sort_order',
    ];

    protected $casts = [
        'base_price'    => 'float',
        'is_available'  => 'boolean',
        'is_active'     => 'boolean',
        'prep_time_min' => 'integer',
        'tags'          => 'array',
        'sort_order'    => 'integer',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ItemVariant::class);
    }

    public function modifiers(): HasMany
    {
        return $this->hasMany(ItemModifier::class);
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true)->where('is_active', true);
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    public function scopeForCategory($query, int $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Effective price — falls back to base_price if no variants.
     */
    public function effectivePrice(): float
    {
        return $this->base_price;
    }
}

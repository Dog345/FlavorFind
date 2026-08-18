<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A size / variant of a menu item (e.g. Small / Large, 250ml / 500ml).
 *
 * @property int    $id
 * @property int    $menu_item_id
 * @property string $name           e.g. "Small", "Large", "Extra Shot"
 * @property float  $price          Absolute price for this variant (overrides base_price)
 * @property bool   $is_available
 * @property int    $sort_order
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class ItemVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'menu_item_id',
        'name',
        'price',
        'is_available',
        'sort_order',
    ];

    protected $casts = [
        'price'        => 'float',
        'is_available' => 'boolean',
        'sort_order'   => 'integer',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}

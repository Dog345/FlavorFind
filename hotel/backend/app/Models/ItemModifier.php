<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An add-on / modifier for a menu item (e.g. "Extra cheese +50", "No onions").
 *
 * @property int    $id
 * @property int    $menu_item_id
 * @property string $name           e.g. "Extra Cheese", "Gluten-free bun"
 * @property float  $price_delta    Amount to add to the item price (can be 0 or negative)
 * @property bool   $is_available
 * @property int    $sort_order
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class ItemModifier extends Model
{
    use HasFactory;

    protected $fillable = [
        'menu_item_id',
        'name',
        'price_delta',
        'is_available',
        'sort_order',
    ];

    protected $casts = [
        'price_delta'  => 'float',
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

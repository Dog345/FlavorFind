<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A single line item within an order.
 *
 * @property int         $id
 * @property int         $order_id
 * @property int         $menu_item_id
 * @property int|null    $variant_id      ItemVariant if applicable
 * @property string      $name            Snapshot of item name at order time
 * @property float       $unit_price      Snapshot of price at order time
 * @property int         $quantity
 * @property float       $line_total       unit_price * quantity + modifier deltas
 * @property array|null  $modifiers        JSON snapshot of chosen modifiers [{name, price_delta}]
 * @property string|null $notes            Special instructions
 * @property string      $status          'pending' | 'preparing' | 'ready' | 'cancelled'
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class OrderItem extends Model
{
    use HasFactory;

    public const STATUS_PENDING   = 'pending';
    public const STATUS_PREPARING = 'preparing';
    public const STATUS_READY     = 'ready';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'order_id',
        'menu_item_id',
        'variant_id',
        'name',
        'unit_price',
        'quantity',
        'line_total',
        'modifiers',
        'notes',
        'status',
    ];

    protected $casts = [
        'unit_price' => 'float',
        'quantity'   => 'integer',
        'line_total' => 'float',
        'modifiers'  => 'array',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ItemVariant::class, 'variant_id');
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Sum of all modifier price deltas for this item line.
     */
    public function modifierDelta(): float
    {
        return collect($this->modifiers ?? [])
            ->sum(fn ($m) => $m['price_delta'] ?? 0.0);
    }

    /**
     * Recompute line_total and save.
     */
    public function recalculate(): void
    {
        $this->line_total = round(($this->unit_price + $this->modifierDelta()) * $this->quantity, 2);
        $this->save();
    }
}

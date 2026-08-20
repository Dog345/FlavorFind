<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * A single order ticket associated with a table session.
 * Multiple orders can belong to one session (e.g. ordering rounds).
 *
 * @property string      $id
 * @property string      $tenant_id
 * @property string      $session_id      TableSession
 * @property string      $table_id
 * @property string|null $waiter_id
 * @property string      $order_number    Human-readable, e.g. "#0042"
 * @property string      $status          One of the STATUS_* constants
 * @property string      $type            'dine_in' | 'takeaway' | 'delivery'
 * @property float       $subtotal
 * @property float       $tax_amount
 * @property float       $discount_amount
 * @property float       $total_amount
 * @property string|null $notes
 * @property \Carbon\Carbon|null $kitchen_accepted_at
 * @property \Carbon\Carbon|null $kitchen_ready_at
 * @property \Carbon\Carbon|null $served_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Order extends Model
{
    use HasFactory, HasUuids;

    // ─── Status constants ────────────────────────────────────────────────────
    public const STATUS_PENDING   = 'pending';    // Just placed, not yet sent to kitchen
    public const STATUS_CONFIRMED = 'confirmed';  // Sent to kitchen
    public const STATUS_PREPARING = 'preparing';  // Kitchen is cooking
    public const STATUS_READY     = 'ready';      // Ready to serve
    public const STATUS_SERVED    = 'served';     // Delivered to table
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_PAID      = 'paid';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONFIRMED,
        self::STATUS_PREPARING,
        self::STATUS_READY,
        self::STATUS_SERVED,
        self::STATUS_CANCELLED,
        self::STATUS_PAID,
    ];

    // ─── Order types ─────────────────────────────────────────────────────────
    public const TYPE_DINE_IN   = 'dine_in';
    public const TYPE_TAKEAWAY  = 'takeaway';
    public const TYPE_DELIVERY  = 'delivery';

    protected $fillable = [
        'tenant_id',
        'session_id',
        'table_id',
        'waiter_id',
        'order_number',
        'status',
        'type',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'notes',
        'kitchen_accepted_at',
        'kitchen_ready_at',
        'served_at',
    ];

    protected $casts = [
        'subtotal'            => 'float',
        'tax_amount'          => 'float',
        'discount_amount'     => 'float',
        'total_amount'        => 'float',
        'kitchen_accepted_at' => 'datetime',
        'kitchen_ready_at'    => 'datetime',
        'served_at'           => 'datetime',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(TableSession::class, 'session_id');
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    public function waiter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'waiter_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeActive($query)
    {
        return $query->whereNotIn('status', [self::STATUS_CANCELLED, self::STATUS_PAID]);
    }

    public function scopeKitchenQueue($query)
    {
        return $query->whereIn('status', [self::STATUS_CONFIRMED, self::STATUS_PREPARING]);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Recalculate totals from items and persist.
     */
    public function recalculate(float $taxRate = 0.16, float $discountAmount = 0.0): void
    {
        $subtotal = $this->items->sum(fn ($i) => $i->unit_price * $i->quantity);
        $tax      = round($subtotal * $taxRate, 2);
        $total    = round($subtotal + $tax - $discountAmount, 2);

        $this->update([
            'subtotal'        => $subtotal,
            'tax_amount'      => $tax,
            'discount_amount' => $discountAmount,
            'total_amount'    => $total,
        ]);
    }
}

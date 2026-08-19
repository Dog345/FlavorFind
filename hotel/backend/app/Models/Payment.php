<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Tracks payment against a single order.
 *
 * @property int         $id
 * @property int         $tenant_id
 * @property int         $order_id
 * @property string      $method          One of the METHOD_* constants
 * @property string      $status          One of the STATUS_* constants
 * @property float       $amount
 * @property float       $amount_tendered Cash tendered (for cash payments)
 * @property float       $change_due      Change to return
 * @property string|null $reference       Internal reference
 * @property string|null $mpesa_receipt   Safaricom M-Pesa receipt number
 * @property string|null $checkout_request_id  M-Pesa STK push ID
 * @property string|null $merchant_request_id
 * @property string|null $phone           Phone used for M-Pesa
 * @property array|null  $metadata        JSON for provider-specific fields
 * @property \Carbon\Carbon|null $paid_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Payment extends Model
{
    use HasFactory;

    // ─── Method constants ────────────────────────────────────────────────────
    public const METHOD_CASH      = 'cash';
    public const METHOD_MPESA     = 'mpesa';
    public const METHOD_CARD      = 'card';
    public const METHOD_COMPLIMENTARY = 'complimentary';

    public const METHODS = [
        self::METHOD_CASH,
        self::METHOD_MPESA,
        self::METHOD_CARD,
        self::METHOD_COMPLIMENTARY,
    ];

    // ─── Status constants ────────────────────────────────────────────────────
    public const STATUS_PENDING   = 'pending';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED    = 'failed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_REFUNDED  = 'refunded';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_COMPLETED,
        self::STATUS_FAILED,
        self::STATUS_CANCELLED,
        self::STATUS_REFUNDED,
    ];

    protected $fillable = [
        'tenant_id',
        'order_id',
        'method',
        'status',
        'amount',
        'amount_tendered',
        'change_due',
        'reference',
        'mpesa_receipt',
        'checkout_request_id',
        'merchant_request_id',
        'phone',
        'metadata',
        'paid_at',
    ];

    protected $casts = [
        'amount'          => 'float',
        'amount_tendered' => 'float',
        'change_due'      => 'float',
        'metadata'        => 'array',
        'paid_at'         => 'datetime',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isMpesa(): bool
    {
        return $this->method === self::METHOD_MPESA;
    }

    public function markCompleted(string $receipt = null): void
    {
        $this->update([
            'status'        => self::STATUS_COMPLETED,
            'mpesa_receipt' => $receipt ?? $this->mpesa_receipt,
            'paid_at'       => now(),
        ]);
    }
}

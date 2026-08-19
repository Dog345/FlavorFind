<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Tracks a single payment transaction against an order.
 *
 * An order can have multiple Payment rows (split bill).
 * The order is considered fully paid when the sum of completed
 * Payment amounts >= order total_amount.
 *
 * @property string      $id                  UUID
 * @property string      $tenant_id
 * @property string      $order_id
 * @property string      $method              One of the METHOD_* constants
 * @property string      $status              One of the STATUS_* constants
 * @property float       $amount              Amount applied to the order
 * @property float|null  $amount_tendered     Cash tendered (cash payments only)
 * @property float|null  $change_due          Change to return (cash payments only)
 * @property string|null $reference           Generic internal reference
 * @property string|null $phone               M-Pesa phone number
 * @property string|null $checkout_request_id M-Pesa STK push checkout ID
 * @property string|null $merchant_request_id M-Pesa merchant request ID
 * @property string|null $mpesa_receipt       Safaricom receipt number
 * @property string|null $external_reference  External POS / bank / card terminal ref
 * @property string|null $external_provider   e.g. "Visa", "Equity Bank", "Airtel Money"
 * @property string|null $cashier_id          User who recorded this payment
 * @property string|null $notes
 * @property array|null  $metadata            Raw provider response JSON
 * @property \Carbon\Carbon|null $paid_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Payment extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    // ─── Method constants ────────────────────────────────────────────────────
    public const METHOD_CASH          = 'cash';
    public const METHOD_MPESA         = 'mpesa';
    public const METHOD_CARD          = 'card';
    public const METHOD_EXTERNAL      = 'external';      // any external system
    public const METHOD_COMPLIMENTARY = 'complimentary'; // house / void

    public const METHODS = [
        self::METHOD_CASH,
        self::METHOD_MPESA,
        self::METHOD_CARD,
        self::METHOD_EXTERNAL,
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
        'phone',
        'checkout_request_id',
        'merchant_request_id',
        'mpesa_receipt',
        'external_reference',
        'external_provider',
        'cashier_id',
        'notes',
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

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
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

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
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

    public function isExternal(): bool
    {
        return $this->method === self::METHOD_EXTERNAL;
    }

    /**
     * Mark this payment as completed and optionally store an M-Pesa receipt.
     */
    public function markCompleted(?string $receipt = null): void
    {
        $this->update([
            'status'        => self::STATUS_COMPLETED,
            'mpesa_receipt' => $receipt ?? $this->mpesa_receipt,
            'paid_at'       => now(),
        ]);
    }

    /**
     * Check if the parent order is fully covered by completed payments.
     * Used after recording any payment to decide whether to mark the order paid.
     */
    public function orderIsFullyPaid(): bool
    {
        $order = $this->order;

        if (! $order) {
            return false;
        }

        $totalPaid = self::where('order_id', $order->id)
            ->where('status', self::STATUS_COMPLETED)
            ->sum('amount');

        return $totalPaid >= $order->total_amount;
    }
}

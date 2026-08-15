<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'table_number',
        'items_json',
        'total_amount',
        'customer_phone',
        'mpesa_checkout_request_id',
        'mpesa_receipt',
        'mpesa_status',
        'order_status',
        'notes',
    ];

    protected $casts = [
        'items_json'   => 'array',
        'total_amount' => 'decimal:2',
    ];

    // M-Pesa status constants
    const MPESA_PENDING   = 'pending';
    const MPESA_PAID      = 'paid';
    const MPESA_FAILED    = 'failed';
    const MPESA_CANCELLED = 'cancelled';

    // Kitchen order status constants
    const STATUS_RECEIVED  = 'received';
    const STATUS_PREP      = 'prep';
    const STATUS_READY     = 'ready';
    const STATUS_COMPLETED = 'completed';

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function isPaid(): bool
    {
        return $this->mpesa_status === self::MPESA_PAID;
    }

    public function scopePending($query)
    {
        return $query->where('order_status', '!=', self::STATUS_COMPLETED);
    }

    public function scopeForKitchen($query)
    {
        return $query->whereIn('order_status', [self::STATUS_RECEIVED, self::STATUS_PREP])
                     ->where('mpesa_status', self::MPESA_PAID)
                     ->orderBy('created_at');
    }
}

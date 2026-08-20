<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A dining session — opened when guests sit, closed when they pay and leave.
 * Links a table to all orders placed during a single visit.
 *
 * @property string           $id
 * @property string           $tenant_id
 * @property string           $table_id
 * @property string|null      $waiter_id     Staff who opened the session
 * @property int              $covers        Number of guests
 * @property string|null      $guest_name    Optional name for the party
 * @property string           $token         Random UUID for QR self-service
 * @property \Carbon\Carbon   $opened_at
 * @property \Carbon\Carbon|null $closed_at
 * @property \Carbon\Carbon   $created_at
 * @property \Carbon\Carbon   $updated_at
 */
class TableSession extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'table_id',
        'waiter_id',
        'covers',
        'guest_name',
        'token',
        'opened_at',
        'closed_at',
    ];

    protected $casts = [
        'covers'    => 'integer',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    public function waiter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'waiter_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'session_id');
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeOpen($query)
    {
        return $query->whereNull('closed_at');
    }

    public function scopeClosed($query)
    {
        return $query->whereNotNull('closed_at');
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function isOpen(): bool
    {
        return $this->closed_at === null;
    }

    public function close(): void
    {
        $this->update(['closed_at' => now()]);
    }

    /**
     * Total amount across all orders in this session.
     */
    public function totalAmount(): float
    {
        return (float) $this->orders()->sum('total_amount');
    }
}

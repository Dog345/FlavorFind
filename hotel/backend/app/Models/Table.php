<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * A physical or virtual table in the venue.
 *
 * @property string      $id
 * @property string      $tenant_id
 * @property string|null $floor_id
 * @property string      $label       e.g. "T01", "Bar-1", "Private-Room"
 * @property int         $capacity    Number of seats
 * @property string      $status      One of the STATUS_* constants
 * @property string|null $qr_code     Base64 data URI or URL to the QR image
 * @property array|null  $position    JSON {x, y} for floor-plan rendering
 * @property bool        $is_active
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Table extends Model
{
    use HasFactory, HasUuids;

    // ─── Status constants ────────────────────────────────────────────────────
    public const STATUS_AVAILABLE = 'available';
    public const STATUS_OCCUPIED  = 'occupied';
    public const STATUS_RESERVED  = 'reserved';
    public const STATUS_CLEANING  = 'cleaning';
    public const STATUS_INACTIVE  = 'inactive';

    public const STATUSES = [
        self::STATUS_AVAILABLE,
        self::STATUS_OCCUPIED,
        self::STATUS_RESERVED,
        self::STATUS_CLEANING,
        self::STATUS_INACTIVE,
    ];

    protected $fillable = [
        'tenant_id',
        'floor_id',
        'label',
        'capacity',
        'status',
        'qr_code',
        'position',
        'is_active',
    ];

    protected $casts = [
        'capacity'  => 'integer',
        'position'  => 'array',
        'is_active' => 'boolean',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function floor(): BelongsTo
    {
        return $this->belongsTo(Floor::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(TableSession::class);
    }

    public function activeSession(): HasOne
    {
        return $this->hasOne(TableSession::class)
            ->whereNull('closed_at')
            ->latestOfMany();
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeAvailable($query)
    {
        return $query->where('status', self::STATUS_AVAILABLE);
    }

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function isAvailable(): bool
    {
        return $this->status === self::STATUS_AVAILABLE;
    }

    public function isOccupied(): bool
    {
        return $this->status === self::STATUS_OCCUPIED;
    }
}

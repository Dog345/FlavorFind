<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A table reservation made in advance by a guest.
 *
 * @property string           $id              UUID
 * @property string           $tenant_id
 * @property string|null      $table_id        Pre-assigned table (nullable until confirmed)
 * @property string|null      $session_id      Set when guest arrives and session is opened
 * @property string           $guest_name
 * @property string           $guest_phone
 * @property string|null      $guest_email
 * @property int              $covers          Number of guests
 * @property \Carbon\Carbon   $reserved_at     Scheduled arrival date-time
 * @property int              $duration_mins   Expected stay in minutes (default 90)
 * @property string           $status          One of the STATUS_* constants
 * @property string|null      $notes
 * @property string|null      $source          'walk_in'|'phone'|'online'|'app'
 * @property \Carbon\Carbon|null $confirmed_at
 * @property \Carbon\Carbon|null $arrived_at
 * @property \Carbon\Carbon|null $cancelled_at
 * @property string|null      $cancellation_reason
 * @property \Carbon\Carbon   $created_at
 * @property \Carbon\Carbon   $updated_at
 */
class Reservation extends Model
{
    use HasFactory, HasUuids;

    // ─── Status constants ────────────────────────────────────────────────────
    public const STATUS_TENTATIVE = 'tentative';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_ARRIVED   = 'arrived';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_NO_SHOW   = 'no_show';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_TENTATIVE,
        self::STATUS_CONFIRMED,
        self::STATUS_ARRIVED,
        self::STATUS_COMPLETED,
        self::STATUS_NO_SHOW,
        self::STATUS_CANCELLED,
    ];

    protected $fillable = [
        'tenant_id',
        'table_id',
        'session_id',
        'guest_name',
        'guest_phone',
        'guest_email',
        'covers',
        'reserved_at',
        'duration_mins',
        'status',
        'notes',
        'source',
        'confirmed_at',
        'arrived_at',
        'cancelled_at',
        'cancellation_reason',
    ];

    protected $casts = [
        'covers'       => 'integer',
        'duration_mins' => 'integer',
        'reserved_at'  => 'datetime',
        'confirmed_at' => 'datetime',
        'arrived_at'   => 'datetime',
        'cancelled_at' => 'datetime',
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

    public function session(): BelongsTo
    {
        return $this->belongsTo(TableSession::class, 'session_id');
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('reserved_at', '>', now())
            ->whereNotIn('status', [self::STATUS_CANCELLED, self::STATUS_NO_SHOW]);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('reserved_at', today())
            ->whereNotIn('status', [self::STATUS_CANCELLED, self::STATUS_NO_SHOW]);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [
            self::STATUS_TENTATIVE,
            self::STATUS_CONFIRMED,
            self::STATUS_ARRIVED,
        ]);
    }

    /**
     * Reservations that overlap with a given time window on a specific table.
     * Used by availability checks to detect conflicts.
     *
     * A conflict exists when:
     *   existing.reserved_at < window_end  AND
     *   existing.reserved_at + existing.duration_min > window_start
     */
    public function scopeConflicting($query, string $tableId, \Carbon\Carbon $start, \Carbon\Carbon $end)
    {
        return $query->where('table_id', $tableId)
            ->whereNotIn('status', [self::STATUS_CANCELLED, self::STATUS_NO_SHOW])
            ->where('reserved_at', '<', $end)
            ->whereRaw("(reserved_at + (duration_mins * INTERVAL '1 minute')) > ?", [$start]);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function cancel(?string $reason = null): void
    {
        $this->update([
            'status'              => self::STATUS_CANCELLED,
            'cancelled_at'        => now(),
            'cancellation_reason' => $reason,
        ]);
    }

    public function confirm(): void
    {
        $this->update([
            'status'       => self::STATUS_CONFIRMED,
            'confirmed_at' => now(),
        ]);
    }

    public function markArrived(?string $sessionId = null): void
    {
        $this->update([
            'status'     => self::STATUS_ARRIVED,
            'arrived_at' => now(),
            'session_id' => $sessionId,
        ]);
    }

    public function isCancellable(): bool
    {
        return ! in_array($this->status, [self::STATUS_CANCELLED, self::STATUS_COMPLETED]);
    }
}

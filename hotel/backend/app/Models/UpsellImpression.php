<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Records every time an upsell suggestion was displayed to the guest/cashier.
 *
 * @property string      $id
 * @property string      $tenant_id
 * @property string|null $upsell_rule_id    null for AI-generated suggestions
 * @property string      $order_id
 * @property string      $trigger_item_id
 * @property string      $suggested_item_id
 * @property string      $source            'manual' | 'ai'
 * @property bool        $accepted
 * @property \Carbon\Carbon|null $accepted_at
 * @property string|null $prompt_text
 * @property \Carbon\Carbon $shown_at
 */
class UpsellImpression extends Model
{
    use HasFactory, HasUuids;

    // This model uses shown_at as its created_at equivalent (no updated_at)
    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'upsell_rule_id',
        'order_id',
        'trigger_item_id',
        'suggested_item_id',
        'source',
        'accepted',
        'accepted_at',
        'prompt_text',
        'shown_at',
    ];

    protected $casts = [
        'accepted'    => 'boolean',
        'accepted_at' => 'datetime',
        'shown_at'    => 'datetime',
    ];

    // ─── Constants ────────────────────────────────────────────────────────────

    public const SOURCE_MANUAL = 'manual';
    public const SOURCE_AI     = 'ai';

    // ─── Relationships ────────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function upsellRule(): BelongsTo
    {
        return $this->belongsTo(UpsellRule::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function triggerItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'trigger_item_id');
    }

    public function suggestedItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'suggested_item_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeAccepted($query)
    {
        return $query->where('accepted', true);
    }

    public function scopeForSource($query, string $source)
    {
        return $query->where('source', $source);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Mark this impression as accepted (guest added the item to the order).
     */
    public function markAccepted(): void
    {
        $this->update([
            'accepted'    => true,
            'accepted_at' => now(),
        ]);
    }
}

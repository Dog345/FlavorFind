<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Drives the upsell / recommendation engine.
 * When a customer orders the trigger_item, suggest the suggested_item.
 *
 * @property int    $id
 * @property int    $tenant_id
 * @property int    $trigger_item_id   MenuItem that triggers this rule
 * @property int    $suggested_item_id MenuItem to suggest
 * @property string $message           e.g. "Pair with a cold Tusker?"
 * @property float  $discount_pct      Optional discount offered (0–100)
 * @property bool   $is_active
 * @property int    $sort_order
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class UpsellRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'trigger_item_id',
        'suggested_item_id',
        'message',
        'discount_pct',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'discount_pct' => 'float',
        'is_active'    => 'boolean',
        'sort_order'   => 'integer',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function triggerItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'trigger_item_id');
    }

    public function suggestedItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'suggested_item_id');
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForTrigger($query, int $menuItemId)
    {
        return $query->where('trigger_item_id', $menuItemId);
    }
}

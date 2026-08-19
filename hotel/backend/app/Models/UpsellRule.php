<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Drives the upsell / recommendation engine.
 * When a customer orders the trigger_item, suggest the suggested_item.
 *
 * @property string $id             UUID
 * @property string $tenant_id
 * @property string $trigger_item_id    MenuItem that triggers this rule
 * @property string $suggested_item_id  MenuItem to suggest
 * @property string|null $prompt_text   e.g. "Would you like garlic bread with that?"
 * @property int    $priority
 * @property bool   $is_active
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class UpsellRule extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'trigger_item_id',
        'suggested_item_id',
        'prompt_text',
        'priority',
        'is_active',
    ];

    protected $casts = [
        'priority'  => 'integer',
        'is_active' => 'boolean',
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

    public function impressions(): HasMany
    {
        return $this->hasMany(UpsellImpression::class);
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForTrigger($query, string $menuItemId)
    {
        return $query->where('trigger_item_id', $menuItemId);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'is_active' => 'boolean',
    ];

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

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderByDesc('priority');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'custom_domain',
        'logo_url',
        'primary_color',
        'features_enabled',
        'mpesa_paybill',
        'mpesa_till',
        'is_active',
    ];

    protected $casts = [
        'features_enabled' => 'array',
        'is_active'        => 'boolean',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function upsellRules(): HasMany
    {
        return $this->hasMany(UpsellRule::class);
    }

    /**
     * Check if a feature is enabled for this tenant's tier.
     */
    public function hasFeature(string $feature): bool
    {
        return in_array($feature, $this->features_enabled ?? []);
    }

    public function getTier(): string
    {
        return $this->features_enabled['tier'] ?? 'starter';
    }
}

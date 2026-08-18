<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    use HasFactory, HasUuids;

    const TIER_STARTER    = 'starter';
    const TIER_PRO        = 'pro';
    const TIER_ENTERPRISE = 'enterprise';

    protected $fillable = [
        'name',
        'slug',
        'custom_domain',
        'logo_url',
        'primary_color',
        'subscription_tier',
        'features_enabled',
        'mpesa_paybill',
        'mpesa_till',
        'mpesa_consumer_key',
        'mpesa_consumer_secret',
        'mpesa_passkey',
        'mpesa_shortcode',
        'mpesa_env',
        'is_active',
        'trial_ends_at',
    ];

    protected $casts = [
        'features_enabled' => 'array',
        'is_active'        => 'boolean',
        'trial_ends_at'    => 'datetime',
    ];

    protected $hidden = [
        'mpesa_consumer_key',
        'mpesa_consumer_secret',
        'mpesa_passkey',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function floors(): HasMany
    {
        return $this->hasMany(Floor::class);
    }

    public function tables(): HasMany
    {
        return $this->hasMany(Table::class);
    }

    public function menuCategories(): HasMany
    {
        return $this->hasMany(MenuCategory::class);
    }

    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function hasFeature(string $feature): bool
    {
        return in_array($feature, $this->features_enabled ?? []);
    }

    public function isOnTrial(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }
}

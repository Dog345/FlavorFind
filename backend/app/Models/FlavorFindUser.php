<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class FlavorFindUser extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    protected $table = 'flavorfind_users';

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar_url',
        'dietary_preferences',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'dietary_preferences'  => 'array',
        'email_verified_at'    => 'datetime',
        'password'             => 'hashed',
    ];

    public function savedRecipes(): HasMany
    {
        return $this->hasMany(SavedRecipe::class, 'user_id');
    }

    public function searchHistory(): HasMany
    {
        return $this->hasMany(SearchHistory::class, 'user_id');
    }
}

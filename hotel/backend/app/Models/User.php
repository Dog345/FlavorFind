<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    // Role constants
    const ROLE_ADMIN   = 'admin';
    const ROLE_MANAGER = 'manager';
    const ROLE_WAITER  = 'waiter';
    const ROLE_KITCHEN = 'kitchen';
    const ROLE_CASHIER = 'cashier';

    const ROLES = [
        self::ROLE_ADMIN,
        self::ROLE_MANAGER,
        self::ROLE_WAITER,
        self::ROLE_KITCHEN,
        self::ROLE_CASHIER,
    ];

    // Role hierarchy — higher number = more permissions
    const ROLE_HIERARCHY = [
        self::ROLE_KITCHEN => 1,
        self::ROLE_WAITER  => 2,
        self::ROLE_CASHIER => 2,
        self::ROLE_MANAGER => 3,
        self::ROLE_ADMIN   => 4,
    ];

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'password',
        'role',
        'phone',
        'avatar_url',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at'     => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isManager(): bool
    {
        return $this->role === self::ROLE_MANAGER;
    }

    public function hasRole(string ...$roles): bool
    {
        return in_array($this->role, $roles);
    }

    public function hasMinRole(string $minRole): bool
    {
        $userLevel = self::ROLE_HIERARCHY[$this->role] ?? 0;
        $minLevel  = self::ROLE_HIERARCHY[$minRole] ?? 0;

        return $userLevel >= $minLevel;
    }
}

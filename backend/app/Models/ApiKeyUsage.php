<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApiKeyUsage extends Model
{
    protected $fillable = [
        'key_hash',
        'key_index',
        'usage_date',
        'request_count',
        'exhausted',
    ];

    protected $casts = [
        'usage_date' => 'date',
        'exhausted'  => 'boolean',
    ];

    /**
     * Get or create today's usage record for a given key.
     */
    public static function todayFor(string $keyHash, int $keyIndex): self
    {
        return self::firstOrCreate(
            ['key_hash' => $keyHash, 'usage_date' => now()->toDateString()],
            ['key_index' => $keyIndex, 'request_count' => 0, 'exhausted' => false]
        );
    }
}

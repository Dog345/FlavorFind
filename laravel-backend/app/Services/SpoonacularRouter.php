<?php

namespace App\Services;

use App\Models\ApiKeyUsage;
use Illuminate\Support\Facades\Log;

/**
 * SmartRouter — picks the next available Spoonacular API key.
 *
 * Strategy:
 *  1. Loop through all keys in order (index 0 → N).
 *  2. Skip any key that is marked exhausted for today.
 *  3. Return the first available key + its usage record.
 *  4. If ALL keys are exhausted → throw an exception.
 *
 * After each successful API call, the caller must invoke
 * SpoonacularRouter::recordUsage() to increment the counter.
 */
class SpoonacularRouter
{
    private array $keys;
    private int $dailyLimit;

    public function __construct()
    {
        $this->keys       = config('spoonacular.keys');
        $this->dailyLimit = config('spoonacular.daily_limit');

        if (empty($this->keys)) {
            throw new \RuntimeException('No Spoonacular API keys configured.');
        }
    }

    /**
     * Returns ['key' => string, 'index' => int, 'usage' => ApiKeyUsage]
     *
     * @throws \RuntimeException when all keys are exhausted for today
     */
    public function getAvailableKey(): array
    {
        $today = now()->toDateString();

        foreach ($this->keys as $index => $key) {
            $keyHash = $this->hash($key);

            // Use updateOrCreate to safely handle concurrent inserts in SQLite
            $usage = ApiKeyUsage::where('key_hash', $keyHash)
                ->where('usage_date', $today)
                ->first();

            if (!$usage) {
                try {
                    $usage = ApiKeyUsage::create([
                        'key_hash'      => $keyHash,
                        'key_index'     => $index,
                        'usage_date'    => $today,
                        'request_count' => 0,
                        'exhausted'     => false,
                    ]);
                } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
                    $usage = ApiKeyUsage::where('key_hash', $keyHash)
                        ->where('usage_date', $today)
                        ->first();
                }
            }

            if (!$usage) {
                continue;
            }

            if ($usage->exhausted || $usage->request_count >= $this->dailyLimit) {
                // Mark exhausted if not already
                if (!$usage->exhausted) {
                    $usage->update(['exhausted' => true]);
                }
                Log::info("SpoonacularRouter: key #{$index} exhausted, trying next.");
                continue;
            }

            return ['key' => $key, 'index' => $index, 'usage' => $usage];
        }

        throw new \RuntimeException('All Spoonacular API keys are exhausted for today.');
    }

    /**
     * Increment usage count after a successful request.
     * Marks key as exhausted if limit is now reached.
     */
    public function recordUsage(ApiKeyUsage $usage): void
    {
        $newCount = $usage->request_count + 1;
        $usage->update([
            'request_count' => $newCount,
            'exhausted'     => $newCount >= $this->dailyLimit,
        ]);
    }

    /**
     * Mark a key as exhausted immediately (e.g. on 402 response from Spoonacular).
     */
    public function markExhausted(ApiKeyUsage $usage): void
    {
        $usage->update(['exhausted' => true]);
        Log::warning("SpoonacularRouter: key #{$usage->key_index} force-marked exhausted.");
    }

    /**
     * Returns stats for all keys today (for /health and /stats endpoints).
     */
    public function getStats(): array
    {
        $today  = now()->toDateString();
        $total  = count($this->keys);
        $usages = ApiKeyUsage::where('usage_date', $today)->get()->keyBy('key_index');

        $keys = [];
        foreach ($this->keys as $index => $key) {
            $usage    = $usages->get($index);
            $keys[]   = [
                'index'         => $index,
                'requests_used' => $usage?->request_count ?? 0,
                'daily_limit'   => $this->dailyLimit,
                'remaining'     => $this->dailyLimit - ($usage?->request_count ?? 0),
                'exhausted'     => $usage?->exhausted ?? false,
            ];
        }

        $activeCount   = collect($keys)->where('exhausted', false)->count();
        $totalUsed     = collect($keys)->sum('requests_used');
        $totalCapacity = $total * $this->dailyLimit;

        return [
            'keys'  => [
                'total'     => $total,
                'active'    => $activeCount,
                'exhausted' => $total - $activeCount,
                'detail'    => $keys,
            ],
            'usage' => [
                'today'       => $totalUsed,
                'capacity'    => $totalCapacity,
                'remaining'   => $totalCapacity - $totalUsed,
                'utilization' => $totalCapacity > 0
                    ? round(($totalUsed / $totalCapacity) * 100, 1) . '%'
                    : '0%',
            ],
        ];
    }

    private function hash(string $key): string
    {
        return hash('sha256', $key);
    }
}

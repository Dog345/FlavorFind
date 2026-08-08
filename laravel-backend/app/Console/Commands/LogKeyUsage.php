<?php

namespace App\Console\Commands;

use App\Services\SpoonacularRouter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class LogKeyUsage extends Command
{
    protected $signature   = 'spoonacular:log-usage';
    protected $description = 'Log daily API key usage and alert if capacity is low';

    public function handle(SpoonacularRouter $router): void
    {
        $stats    = $router->getStats();
        $usage    = $stats['usage'];
        $keys     = $stats['keys'];
        $pct      = $usage['capacity'] > 0
            ? round(($usage['today'] / $usage['capacity']) * 100, 1)
            : 0;

        Log::channel('daily')->info('Spoonacular usage', [
            'used'       => $usage['today'],
            'capacity'   => $usage['capacity'],
            'remaining'  => $usage['remaining'],
            'pct'        => "{$pct}%",
            'active_keys'=> $keys['active'],
            'exhausted'  => $keys['exhausted'],
        ]);

        $this->info("📊 Usage: {$usage['today']}/{$usage['capacity']} ({$pct}%) — {$keys['active']} keys active");

        // Phase 8: alert when remaining capacity drops below 20%
        if ($pct >= 80) {
            Log::warning("⚠️  Spoonacular capacity at {$pct}% — only {$usage['remaining']} requests left today.");
            $this->warn("⚠️  WARNING: Capacity at {$pct}%! Add more API keys.");
        }
    }
}

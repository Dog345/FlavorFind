<?php

namespace App\Console\Commands;

use App\Models\Table;
use App\Models\Tenant;
use App\Services\QrCodeService;
use Illuminate\Console\Command;

class GenerateQrCodes extends Command
{
    protected $signature = 'hotel:generate-qrcodes
                            {--tenant= : Tenant slug (omit to process all tenants)}
                            {--force   : Regenerate even if QR already exists}';

    protected $description = 'Generate QR codes for all hotel tables';

    public function handle(QrCodeService $qr): int
    {
        $tenantSlug = $this->option('tenant');
        $force      = $this->option('force');

        $query = Tenant::where('is_active', true);

        if ($tenantSlug) {
            $query->where('slug', $tenantSlug);
        }

        $tenants = $query->get();

        if ($tenants->isEmpty()) {
            $this->error('No active tenants found.');
            return self::FAILURE;
        }

        $total   = 0;
        $skipped = 0;

        foreach ($tenants as $tenant) {
            $this->info("Processing tenant: {$tenant->name} ({$tenant->slug})");

            $tables = Table::where('tenant_id', $tenant->id)
                ->where('is_active', true)
                ->get();

            if ($tables->isEmpty()) {
                $this->line("  → No active tables.");
                continue;
            }

            $bar = $this->output->createProgressBar($tables->count());
            $bar->start();

            foreach ($tables as $table) {
                if (! $force && ! empty($table->qr_code)) {
                    $skipped++;
                    $bar->advance();
                    continue;
                }

                $qr->generateForTable($table, $tenant->slug);
                $total++;
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $this->line("  → Generated: {$total} | Skipped (already exist): {$skipped}");
        }

        $this->info('Done.');
        return self::SUCCESS;
    }
}

<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    /**
     * Resolve the current tenant on every API request.
     *
     * Resolution order:
     *  1. X-Tenant-ID header (UUID) — used by mobile apps and direct API clients
     *  2. Authenticated user's tenant_id — set after Sanctum auth
     *  3. Subdomain — e.g. "westlands-grill.flavorfind.co" → slug = "westlands-grill"
     *  4. Custom domain — full domain match against tenants.custom_domain
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = null;

        // 1. Explicit header (highest priority — used by Kotlin app, Postman, etc.)
        if ($request->hasHeader('X-Tenant-ID')) {
            $tenant = Tenant::where('id', $request->header('X-Tenant-ID'))
                ->where('is_active', true)
                ->first();
        }

        // 2. Authenticated user's tenant
        if (! $tenant && $request->user()) {
            $tenant = $request->user()->tenant;
        }

        // 3. Subdomain resolution — "westlands-grill.flavorfind.co"
        if (! $tenant) {
            $host = $request->getHost();
            $parts = explode('.', $host);

            if (count($parts) >= 3) {
                $slug = $parts[0];
                $tenant = Tenant::where('slug', $slug)
                    ->where('is_active', true)
                    ->first();
            }
        }

        // 4. Custom domain — "menu.westlandsgrill.com"
        if (! $tenant) {
            $host = $request->getHost();
            $tenant = Tenant::where('custom_domain', $host)
                ->where('is_active', true)
                ->first();
        }

        if (! $tenant) {
            return response()->json([
                'error'   => 'Tenant not found.',
                'message' => 'Could not resolve a valid tenant for this request.',
            ], 401);
        }

        // Bind tenant to the request so controllers can access it via $request->tenant()
        $request->merge(['_tenant' => $tenant]);
        $request->macro('tenant', fn () => $tenant);

        // ── Critical: set PostgreSQL session variable so RLS policies activate ──
        // This tells the DB engine: "only show rows for this tenant"
        DB::statement("SET LOCAL app.current_tenant_id = ?", [$tenant->id]);

        return $next($request);
    }
}

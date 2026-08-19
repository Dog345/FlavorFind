<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    // Routes that don't require a tenant
    private const EXEMPT = [
        'api/health',
        'api/v1/auth/register',
        'api/v1/auth/login',
        'up',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // Skip tenant resolution for exempt routes
        foreach (self::EXEMPT as $path) {
            if ($request->is($path)) {
                return $next($request);
            }
        }

        $slug = $this->resolveSlug($request);

        if (! $slug) {
            return response()->json(['error' => 'Tenant not specified.'], 400);
        }

        $tenant = Cache::remember("tenant_slug_{$slug}", 3600, function () use ($slug) {
            return Tenant::where('slug', $slug)->first();
        });

        if (! $tenant) {
            return response()->json(['error' => 'Tenant not found.'], 404);
        }

        if (! $tenant->is_active) {
            return response()->json(['error' => 'Tenant account is suspended.'], 403);
        }

        // Attach tenant to request for use in controllers
        $request->macro('tenant', fn () => $tenant);

        return $next($request);
    }

    private function resolveSlug(Request $request): ?string
    {
        // 1. X-Tenant-Slug header (used by staff dashboard and API clients)
        if ($request->hasHeader('X-Tenant-Slug')) {
            return strtolower(trim($request->header('X-Tenant-Slug')));
        }

        // 2. Subdomain: acme.hotel.flavorfind.co.ke → slug = acme
        $host = $request->getHost();
        if (str_contains($host, '.hotel.flavorfind.co.ke')) {
            return explode('.', $host)[0];
        }

        // 3. Custom domain — look up by full host
        if (! str_contains($host, 'localhost') && ! str_contains($host, '127.0.0.1')) {
            $tenant = Cache::remember("tenant_domain_{$host}", 3600, function () use ($host) {
                return Tenant::where('custom_domain', $host)->first();
            });
            if ($tenant) {
                return $tenant->slug;
            }
        }

        return null;
    }
}

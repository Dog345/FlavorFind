<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireRole
{
    /**
     * Usage: middleware('role:admin,manager')
     * Passes if the authenticated user has ANY of the listed roles.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        if (empty($roles) || $user->hasRole(...$roles)) {
            return $next($request);
        }

        return response()->json([
            'error' => 'Forbidden. Required role: ' . implode(' or ', $roles) . '.',
        ], 403);
    }
}

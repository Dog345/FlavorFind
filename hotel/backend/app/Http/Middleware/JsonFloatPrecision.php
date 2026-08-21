<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensures all JSON responses preserve float precision.
 *
 * PHP's json_encode serialises whole-number floats (e.g. 0.0, 1000.0) as
 * bare integers (0, 1000) by default.  This causes strict-type mismatches
 * for API clients that expect floats in monetary fields.
 *
 * Setting JSON_PRESERVE_ZERO_FRACTION makes 0.0 → "0.0" and 1000.0 → "1000.0".
 */
class JsonFloatPrecision
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($response instanceof JsonResponse) {
            $response->setEncodingOptions(
                $response->getEncodingOptions() | JSON_PRESERVE_ZERO_FRACTION
            );
        }

        return $response;
    }
}

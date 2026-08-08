<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SpoonacularHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $keyIndex  = $request->attributes->get('_spoonacular_key_index');
        $remaining = $request->attributes->get('_spoonacular_remaining');

        if (!is_null($keyIndex)) {
            $response->headers->set('X-Key-Used', (string) $keyIndex);
            $response->headers->set('X-Requests-Remaining', (string) $remaining);
        }

        return $response;
    }
}

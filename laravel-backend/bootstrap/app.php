<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Phase 6: rate limit all /api/* routes — 60 requests per minute per IP
        $middleware->appendToGroup('api', 'throttle:60,1');
        // Phase 5: attach Spoonacular debug headers
        $middleware->appendToGroup('api', \App\Http\Middleware\SpoonacularHeaders::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Phase 5: all keys exhausted → 429
        $exceptions->render(function (\RuntimeException $e, Request $request) {
            if ($request->is('api/*')) {
                $status = str_contains($e->getMessage(), 'exhausted') ? 429 : 502;
                return response()->json(['error' => $e->getMessage()], $status);
            }
        });

        // Phase 5: validation errors → 422
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['error' => $e->errors()], 422);
            }
        });
    })->create();

<?php

namespace App\Http\Controllers;

use App\Services\SpoonacularRouter;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function __construct(private SpoonacularRouter $router) {}

    /**
     * GET /api/health
     */
    public function health(): JsonResponse
    {
        $stats = $this->router->getStats();

        return response()->json([
            'status'  => 'ok',
            'service' => 'FlavorFind API',
            ...$stats,
        ]);
    }

    /**
     * GET /api/stats — detailed key usage breakdown
     */
    public function stats(): JsonResponse
    {
        return response()->json($this->router->getStats());
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

abstract class Controller
{
    /**
     * Return a JSON response with JSON_PRESERVE_ZERO_FRACTION so that whole-number
     * floats (0.0, 1000.0) serialise as "0.0" / "1000.0" rather than bare integers.
     * This prevents strict-type mismatches for API clients that expect float fields.
     */
    protected function jsonResponse(mixed $data, int $status = 200, array $headers = []): JsonResponse
    {
        return response()->json($data, $status, $headers, JSON_PRESERVE_ZERO_FRACTION);
    }
}

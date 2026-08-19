<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FloorController;
use App\Http\Controllers\MenuCategoryController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Hotel Manager API — v1
|--------------------------------------------------------------------------
|
| All routes are prefixed /api/v1/
|
| Tenant resolution: ResolveTenant middleware runs on all routes.
| Auth routes (register/login) are exempt from tenant requirement.
| Protected routes require Sanctum token via 'auth:sanctum'.
| Role-restricted routes use 'role:admin,manager' etc.
|
*/

// ── Health check ──────────────────────────────────────────────────────────────
Route::get('/health', function () {
    return response()->json([
        'status'    => 'ok',
        'service'   => 'hotel-api',
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::prefix('v1')->group(function () {

    // ── Auth (no tenant required for register/login) ──────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login',    [AuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout',  [AuthController::class, 'logout']);
            Route::get('me',       [AuthController::class, 'me']);
            Route::post('refresh', [AuthController::class, 'refresh']);
        });
    });

    // ── All routes below require auth + active tenant ─────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // ── Tenant ────────────────────────────────────────────────────────────
        Route::prefix('tenant')->group(function () {
            Route::get('/',     [TenantController::class, 'show']);
            Route::put('/',     [TenantController::class, 'update'])->middleware('role:admin');
            Route::get('stats', [TenantController::class, 'stats']);
        });

        // ── Staff ─────────────────────────────────────────────────────────────
        Route::prefix('staff')->middleware('role:admin,manager')->group(function () {
            Route::get('/',        [AuthController::class, 'listStaff']);
            Route::post('/',       [AuthController::class, 'inviteStaff']);
            Route::put('/{id}',    [AuthController::class, 'updateStaff']);
            Route::delete('/{id}', [AuthController::class, 'removeStaff']);
            Route::patch('/{id}/role', [AuthController::class, 'changeRole']);
        });

        // ── Floors ────────────────────────────────────────────────────────────
        Route::prefix('floors')->group(function () {
            Route::get('/',        [FloorController::class, 'index']);
            Route::get('/{id}',    [FloorController::class, 'show']);
            Route::post('/',       [FloorController::class, 'store'])->middleware('role:admin,manager');
            Route::put('/{id}',    [FloorController::class, 'update'])->middleware('role:admin,manager');
            Route::delete('/{id}', [FloorController::class, 'destroy'])->middleware('role:admin');
        });

        // ── Tables ────────────────────────────────────────────────────────────
        Route::prefix('tables')->group(function () {
            Route::get('/',    [TableController::class, 'index']);
            Route::get('/{id}', [TableController::class, 'show']);
            Route::post('/',   [TableController::class, 'store'])->middleware('role:admin,manager');
            Route::put('/{id}', [TableController::class, 'update'])->middleware('role:admin,manager');
            Route::delete('/{id}', [TableController::class, 'destroy'])->middleware('role:admin');

            // Session management (waiters can open/close)
            Route::post('/{id}/open',     [TableController::class, 'openSession']);
            Route::post('/{id}/close',    [TableController::class, 'closeSession']);
            Route::get('/{id}/sessions',  [TableController::class, 'sessions']);
        });

        // ── Menu ──────────────────────────────────────────────────────────────
        Route::prefix('menu')->group(function () {

            // Categories
            Route::prefix('categories')->group(function () {
                Route::get('/',        [MenuCategoryController::class, 'index']);
                Route::get('/{id}',    [MenuCategoryController::class, 'show']);
                Route::post('/',       [MenuCategoryController::class, 'store'])->middleware('role:admin,manager');
                Route::put('/{id}',    [MenuCategoryController::class, 'update'])->middleware('role:admin,manager');
                Route::delete('/{id}', [MenuCategoryController::class, 'destroy'])->middleware('role:admin,manager');
            });

            // Items
            Route::prefix('items')->group(function () {
                Route::get('/',        [MenuItemController::class, 'index']);
                Route::get('/{id}',    [MenuItemController::class, 'show']);
                Route::post('/',       [MenuItemController::class, 'store'])->middleware('role:admin,manager');
                Route::put('/{id}',    [MenuItemController::class, 'update'])->middleware('role:admin,manager');
                Route::delete('/{id}', [MenuItemController::class, 'destroy'])->middleware('role:admin,manager');

                // Variants
                Route::get('/{id}/variants',               [MenuItemController::class, 'variants']);
                Route::post('/{id}/variants',              [MenuItemController::class, 'storeVariant'])->middleware('role:admin,manager');
                Route::put('/{id}/variants/{variantId}',   [MenuItemController::class, 'updateVariant'])->middleware('role:admin,manager');
                Route::delete('/{id}/variants/{variantId}',[MenuItemController::class, 'destroyVariant'])->middleware('role:admin,manager');

                // Modifiers
                Route::get('/{id}/modifiers',                [MenuItemController::class, 'modifiers']);
                Route::post('/{id}/modifiers',               [MenuItemController::class, 'storeModifier'])->middleware('role:admin,manager');
                Route::put('/{id}/modifiers/{modifierId}',   [MenuItemController::class, 'updateModifier'])->middleware('role:admin,manager');
                Route::delete('/{id}/modifiers/{modifierId}',[MenuItemController::class, 'destroyModifier'])->middleware('role:admin,manager');
            });
        });

    });
});

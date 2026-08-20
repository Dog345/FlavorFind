<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FloorController;
use App\Http\Controllers\GuestController;
use App\Http\Controllers\MenuCategoryController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\UpsellRuleController;
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

    // ── M-Pesa callback — NO auth, Safaricom calls this directly ─────────────
    Route::post('payments/mpesa/callback', [PaymentController::class, 'mpesaCallback']);

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

    // ── Guest QR ordering — NO auth, secured by session token in URL ─────────
    // Tenant is resolved from the TableSession token (no X-Tenant-Slug header needed).
    Route::prefix('guest/{token}')->withoutMiddleware(\App\Http\Middleware\ResolveTenant::class)->group(function () {
        Route::get('/',                           [GuestController::class, 'resolveSession']);
        Route::get('/menu',                       [GuestController::class, 'menu']);
        Route::get('/menu/search',                [GuestController::class, 'searchMenu']);
        Route::get('/popular',                    [GuestController::class, 'popular']);
        Route::post('/orders',                    [GuestController::class, 'placeOrder']);
        Route::get('/orders/{orderId}',           [GuestController::class, 'trackOrder']);
        Route::get('/upsell',                     [GuestController::class, 'upsell']);
        Route::post('/payments/mpesa',            [GuestController::class, 'initiatePayment']);
        Route::get('/payments/{paymentId}/status',[GuestController::class, 'paymentStatus']);
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

        // ── Orders ────────────────────────────────────────────────────────────
        Route::prefix('orders')->group(function () {
            Route::get('/kitchen',            [OrderController::class, 'kitchen']);      // Kitchen display
            Route::get('/session/{sessionId}',[OrderController::class, 'bySession']);   // Session bill
            Route::get('/',                   [OrderController::class, 'index']);
            Route::post('/',                  [OrderController::class, 'store']);
            Route::get('/{id}',               [OrderController::class, 'show']);
            Route::patch('/{id}/status',                        [OrderController::class, 'updateStatus']);
            Route::patch('/{id}/items/{itemId}/status',         [OrderController::class, 'updateItemStatus'])->middleware('role:admin,manager,kitchen,waiter');
            Route::post('/{id}/cancel',                         [OrderController::class, 'cancel']);

            // Payments per order
            Route::post('/{orderId}/payments/mpesa',     [PaymentController::class, 'initiateStk']);
            Route::post('/{orderId}/payments/cash',      [PaymentController::class, 'cash'])->middleware('role:admin,manager,cashier');
            Route::post('/{orderId}/payments/external',  [PaymentController::class, 'external'])->middleware('role:admin,manager,cashier');
        });

        // ── Payments ──────────────────────────────────────────────────────────
        // Listing + reconciliation (admin/manager/cashier)
        Route::get('payments',                        [PaymentController::class, 'index'])->middleware('role:admin,manager,cashier');
        Route::get('payments/reconciliation',         [PaymentController::class, 'reconciliation'])->middleware('role:admin,manager,cashier');
        // Status polling (any authenticated user can check their payment)
        Route::get('payments/{paymentId}/status',     [PaymentController::class, 'status']);

        // ── Reservations ──────────────────────────────────────────────────────
        Route::prefix('reservations')->group(function () {
            // Static routes BEFORE /{id} to avoid conflict
            Route::get('/availability',  [ReservationController::class, 'availability']);

            Route::get('/',              [ReservationController::class, 'index']);
            Route::post('/',             [ReservationController::class, 'store']);
            Route::get('/{id}',          [ReservationController::class, 'show']);
            Route::put('/{id}',          [ReservationController::class, 'update'])->middleware('role:admin,manager');
            Route::post('/{id}/confirm', [ReservationController::class, 'confirm'])->middleware('role:admin,manager');
            Route::post('/{id}/arrive',  [ReservationController::class, 'markArrived']);
            Route::post('/{id}/cancel',  [ReservationController::class, 'cancel']);
            Route::patch('/{id}/no-show',[ReservationController::class, 'noShow'])->middleware('role:admin,manager');
        });

        // ── Analytics & Reporting ─────────────────────────────────────────────
        Route::prefix('analytics')->middleware('role:admin,manager')->group(function () {
            Route::get('/revenue',           [AnalyticsController::class, 'revenue']);
            Route::get('/top-items',         [AnalyticsController::class, 'topItems']);
            Route::get('/hourly-orders',     [AnalyticsController::class, 'hourlyOrders']);
            Route::get('/status-funnel',     [AnalyticsController::class, 'statusFunnel']);
            Route::get('/payment-breakdown', [AnalyticsController::class, 'paymentBreakdown']);
            Route::get('/table-occupancy',   [AnalyticsController::class, 'tableOccupancy']);
            Route::get('/export',            [AnalyticsController::class, 'export']);
        });

        // ── Upsell Rules ──────────────────────────────────────────────────────
        Route::prefix('upsell-rules')->group(function () {            // Static routes BEFORE /{id} to avoid collision
            Route::get('/suggestions',                              [UpsellRuleController::class, 'suggestions']);
            Route::get('/analytics',                               [UpsellRuleController::class, 'analytics'])->middleware('role:admin,manager');
            Route::post('/impressions',                            [UpsellRuleController::class, 'recordImpression']);
            Route::patch('/impressions/{impressionId}/accept',     [UpsellRuleController::class, 'acceptImpression']);

            // CRUD
            Route::get('/',             [UpsellRuleController::class, 'index']);
            Route::post('/',            [UpsellRuleController::class, 'store'])->middleware('role:admin,manager');
            Route::get('/{id}',         [UpsellRuleController::class, 'show']);
            Route::put('/{id}',         [UpsellRuleController::class, 'update'])->middleware('role:admin,manager');
            Route::delete('/{id}',      [UpsellRuleController::class, 'destroy'])->middleware('role:admin,manager');
        });

    });
});

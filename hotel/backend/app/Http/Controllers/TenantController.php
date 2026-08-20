<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{
    /**
     * GET /api/v1/tenant
     */
    public function show(Request $request): JsonResponse
    {
        $tenant = $request->user()->tenant;

        return response()->json($tenant->makeHidden([
            'mpesa_consumer_key',
            'mpesa_consumer_secret',
            'mpesa_passkey',
        ]));
    }

    /**
     * PUT /api/v1/tenant
     * Admin only — update branding and M-Pesa config.
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'name'                  => 'sometimes|string|max:255',
            'logo_url'              => 'nullable|url',
            'primary_color'         => 'nullable|string|regex:/^#[0-9a-fA-F]{6}$/',
            'mpesa_paybill'         => 'nullable|string|max:20',
            'mpesa_till'            => 'nullable|string|max:20',
            'mpesa_consumer_key'    => 'nullable|string',
            'mpesa_consumer_secret' => 'nullable|string',
            'mpesa_passkey'         => 'nullable|string',
            'mpesa_shortcode'       => 'nullable|string|max:20',
            'mpesa_env'             => 'nullable|in:sandbox,production',
        ]);

        $tenant = $request->user()->tenant;
        $tenant->update($request->only([
            'name', 'logo_url', 'primary_color',
            'mpesa_paybill', 'mpesa_till', 'mpesa_consumer_key',
            'mpesa_consumer_secret', 'mpesa_passkey', 'mpesa_shortcode', 'mpesa_env',
        ]));

        return response()->json($tenant->makeHidden([
            'mpesa_consumer_key', 'mpesa_consumer_secret', 'mpesa_passkey',
        ]));
    }

    /**
     * GET /api/v1/tenant/stats
     *
     * Quick dashboard counters for the home widget.
     * All queries are explicitly scoped to the authenticated user's tenant.
     */
    public function stats(Request $request): JsonResponse
    {
        $tenantId = $request->tenant()->id;
        $today    = today()->toDateString();

        // ── Orders today (non-cancelled) ──────────────────────────────────────
        $ordersToday = Order::where('tenant_id', $tenantId)
            ->whereDate('created_at', $today)
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->count();

        // ── Revenue today (sum of completed payments) ─────────────────────────
        $revenueToday = Payment::where('tenant_id', $tenantId)
            ->where('status', Payment::STATUS_COMPLETED)
            ->whereDate('paid_at', $today)
            ->sum('amount');

        // ── Active (in-flight) orders ─────────────────────────────────────────
        $activeOrders = Order::where('tenant_id', $tenantId)
            ->whereIn('status', [
                Order::STATUS_PENDING,
                Order::STATUS_CONFIRMED,
                Order::STATUS_PREPARING,
                Order::STATUS_READY,
            ])
            ->count();

        // ── Table occupancy ───────────────────────────────────────────────────
        $occupiedTables = Table::where('tenant_id', $tenantId)
            ->where('status', Table::STATUS_OCCUPIED)
            ->count();

        $totalTables = Table::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->count();

        // ── Today's reservations (confirmed / tentative) ──────────────────────
        $reservationsToday = Reservation::where('tenant_id', $tenantId)
            ->whereDate('reserved_at', $today)
            ->whereIn('status', [
                Reservation::STATUS_TENTATIVE,
                Reservation::STATUS_CONFIRMED,
            ])
            ->count();

        return response()->json([
            'orders_today'       => $ordersToday,
            'revenue_today'      => round((float) $revenueToday, 2),
            'active_orders'      => $activeOrders,
            'occupied_tables'    => $occupiedTables,
            'total_tables'       => $totalTables,
            'occupancy_rate'     => $totalTables > 0
                ? round($occupiedTables / $totalTables * 100, 1)
                : 0.0,
            'reservations_today' => $reservationsToday,
            'as_of'              => now()->toIso8601String(),
        ]);
    }
}

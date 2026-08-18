<?php

namespace App\Http\Controllers;

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

        return response()->json($tenant);
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

        // Don't return sensitive M-Pesa keys in response
        return response()->json($tenant->makeHidden([
            'mpesa_consumer_key', 'mpesa_consumer_secret', 'mpesa_passkey',
        ]));
    }

    /**
     * GET /api/v1/tenant/stats
     * Quick numbers for the dashboard home widget.
     */
    public function stats(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $today    = now()->toDateString();

        $stats = DB::selectOne("
            SELECT
                (SELECT COUNT(*)::int FROM orders
                 WHERE tenant_id = :t1
                   AND DATE(created_at) = :today
                   AND status != 'cancelled') AS orders_today,

                (SELECT COALESCE(SUM(amount), 0)::numeric(10,2) FROM payments
                 WHERE tenant_id = :t2
                   AND DATE(created_at) = :today2
                   AND mpesa_status = 'paid' OR (method = 'cash' AND mpesa_status IS NULL)) AS revenue_today,

                (SELECT COUNT(*)::int FROM orders
                 WHERE tenant_id = :t3
                   AND status IN ('pending','confirmed','prep')) AS active_orders,

                (SELECT COUNT(*)::int FROM tables
                 WHERE tenant_id = :t4
                   AND status = 'occupied') AS occupied_tables,

                (SELECT COUNT(*)::int FROM tables
                 WHERE tenant_id = :t5) AS total_tables,

                (SELECT COUNT(*)::int FROM reservations
                 WHERE tenant_id = :t6
                   AND DATE(reserved_at) = :today3
                   AND status IN ('pending','confirmed')) AS reservations_today
        ", [
            't1' => $tenantId, 'today'  => $today,
            't2' => $tenantId, 'today2' => $today,
            't3' => $tenantId,
            't4' => $tenantId,
            't5' => $tenantId,
            't6' => $tenantId, 'today3' => $today,
        ]);

        return response()->json($stats);
    }
}

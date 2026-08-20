<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Table;
use App\Models\TableSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

/**
 * AnalyticsController
 *
 * All endpoints are scoped to the authenticated user's tenant.
 * All require role: admin or manager.
 *
 * Endpoints:
 *   GET /api/v1/analytics/revenue           — revenue over time (daily/weekly/monthly)
 *   GET /api/v1/analytics/top-items         — top-selling menu items by qty and revenue
 *   GET /api/v1/analytics/hourly-orders     — order count by hour of day (heatmap data)
 *   GET /api/v1/analytics/status-funnel     — order counts by status
 *   GET /api/v1/analytics/payment-breakdown — revenue split by payment method
 *   GET /api/v1/analytics/table-occupancy   — occupancy and turn-over rate per table
 *   GET /api/v1/analytics/export            — CSV download of any of the above reports
 *
 * Common query params:
 *   date_from   Y-m-d   (defaults to 30 days ago)
 *   date_to     Y-m-d   (defaults to today)
 */
class AnalyticsController extends Controller
{
    // ─── Shared date defaults ─────────────────────────────────────────────────

    private function dateRange(Request $request): array
    {
        $from = $request->filled('date_from')
            ? \Carbon\Carbon::parse($request->string('date_from'))->startOfDay()
            : now()->subDays(29)->startOfDay();

        $to = $request->filled('date_to')
            ? \Carbon\Carbon::parse($request->string('date_to'))->endOfDay()
            : now()->endOfDay();

        return [$from, $to];
    }

    private function validateDateRange(Request $request): void
    {
        $request->validate([
            'date_from' => 'sometimes|date_format:Y-m-d',
            'date_to'   => 'sometimes|date_format:Y-m-d|after_or_equal:date_from',
        ]);
    }

    // ─── Revenue ─────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/analytics/revenue
     *
     * Daily/weekly/monthly revenue from completed payments.
     *
     * Query params:
     *   date_from   Y-m-d
     *   date_to     Y-m-d
     *   granularity 'day' | 'week' | 'month'  (default: day)
     */
    public function revenue(Request $request): JsonResponse
    {
        $this->validateDateRange($request);
        $request->validate([
            'granularity' => 'sometimes|in:day,week,month',
        ]);

        $tenantId    = $request->tenant()->id;
        [$from, $to] = $this->dateRange($request);
        $gran        = $request->input('granularity', 'day');

        $truncExpr = match ($gran) {
            'week'  => "date_trunc('week', paid_at)",
            'month' => "date_trunc('month', paid_at)",
            default => "date_trunc('day', paid_at)",
        };

        $rows = DB::table('payments')
            ->selectRaw("{$truncExpr} AS period, COUNT(*) AS transactions, SUM(amount) AS revenue")
            ->where('tenant_id', $tenantId)
            ->where('status', Payment::STATUS_COMPLETED)
            ->whereBetween('paid_at', [$from, $to])
            ->groupByRaw($truncExpr)
            ->orderByRaw($truncExpr)
            ->get()
            ->map(fn ($r) => [
                'period'       => \Carbon\Carbon::parse($r->period)->toDateString(),
                'transactions' => (int) $r->transactions,
                'revenue'      => round((float) $r->revenue, 2),
            ]);

        $totalRevenue = $rows->sum('revenue');
        $totalTxns    = $rows->sum('transactions');

        return response()->json([
            'data'  => $rows,
            'meta'  => [
                'date_from'     => $from->toDateString(),
                'date_to'       => $to->toDateString(),
                'granularity'   => $gran,
                'total_revenue' => round($totalRevenue, 2),
                'total_transactions' => $totalTxns,
            ],
        ]);
    }

    // ─── Top Items ────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/analytics/top-items
     *
     * Top-selling menu items ranked by quantity sold and revenue.
     *
     * Query params:
     *   date_from   Y-m-d
     *   date_to     Y-m-d
     *   limit       int 1–100 (default 10)
     *   sort        'quantity' | 'revenue'  (default: revenue)
     */
    public function topItems(Request $request): JsonResponse
    {
        $this->validateDateRange($request);
        $request->validate([
            'limit' => 'sometimes|integer|min:1|max:100',
            'sort'  => 'sometimes|in:quantity,revenue',
        ]);

        $tenantId    = $request->tenant()->id;
        [$from, $to] = $this->dateRange($request);
        $limit       = (int) $request->input('limit', 10);
        $sort        = $request->input('sort', 'revenue');

        $orderBy = $sort === 'quantity' ? 'total_quantity DESC' : 'total_revenue DESC';

        $rows = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->selectRaw('
                order_items.name,
                SUM(order_items.quantity) AS total_quantity,
                SUM(order_items.line_total) AS total_revenue,
                COUNT(DISTINCT orders.id) AS order_count
            ')
            ->where('orders.tenant_id', $tenantId)
            ->whereNotIn('orders.status', [Order::STATUS_CANCELLED])
            ->whereBetween('orders.created_at', [$from, $to])
            ->groupBy('order_items.name')
            ->orderByRaw($orderBy)
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'name'           => $r->name,
                'total_quantity' => (int) $r->total_quantity,
                'total_revenue'  => round((float) $r->total_revenue, 2),
                'order_count'    => (int) $r->order_count,
            ]);

        return response()->json([
            'data' => $rows,
            'meta' => [
                'date_from' => $from->toDateString(),
                'date_to'   => $to->toDateString(),
                'sort'      => $sort,
                'limit'     => $limit,
            ],
        ]);
    }

    // ─── Hourly Orders ────────────────────────────────────────────────────────

    /**
     * GET /api/v1/analytics/hourly-orders
     *
     * Order count grouped by hour of day (0–23).
     * Used to render a heatmap showing peak service hours.
     *
     * Query params:
     *   date_from   Y-m-d
     *   date_to     Y-m-d
     */
    public function hourlyOrders(Request $request): JsonResponse
    {
        $this->validateDateRange($request);

        $tenantId    = $request->tenant()->id;
        [$from, $to] = $this->dateRange($request);

        $rows = DB::table('orders')
            ->selectRaw("EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*) AS order_count")
            ->where('tenant_id', $tenantId)
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->whereBetween('created_at', [$from, $to])
            ->groupByRaw('EXTRACT(HOUR FROM created_at)')
            ->orderByRaw('hour')
            ->get()
            ->keyBy('hour');

        // Fill all 24 hours so the frontend always gets a complete array
        $hours = collect(range(0, 23))->map(fn ($h) => [
            'hour'        => $h,
            'order_count' => (int) ($rows->get($h)?->order_count ?? 0),
            'label'       => sprintf('%02d:00', $h),
        ]);

        return response()->json([
            'data' => $hours,
            'meta' => [
                'date_from'   => $from->toDateString(),
                'date_to'     => $to->toDateString(),
                'peak_hour'   => $hours->sortByDesc('order_count')->first()['hour'],
                'total_orders'=> $hours->sum('order_count'),
            ],
        ]);
    }

    // ─── Status Funnel ────────────────────────────────────────────────────────

    /**
     * GET /api/v1/analytics/status-funnel
     *
     * Order counts grouped by status for a given period.
     * Shows the conversion funnel: pending → confirmed → preparing → ready → served → paid.
     *
     * Query params:
     *   date_from   Y-m-d
     *   date_to     Y-m-d
     */
    public function statusFunnel(Request $request): JsonResponse
    {
        $this->validateDateRange($request);

        $tenantId    = $request->tenant()->id;
        [$from, $to] = $this->dateRange($request);

        $rows = DB::table('orders')
            ->selectRaw('status, COUNT(*) AS count')
            ->where('tenant_id', $tenantId)
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $funnelOrder = [
            Order::STATUS_PENDING,
            Order::STATUS_CONFIRMED,
            Order::STATUS_PREPARING,
            Order::STATUS_READY,
            Order::STATUS_SERVED,
            Order::STATUS_PAID,
            Order::STATUS_CANCELLED,
        ];

        $funnel = collect($funnelOrder)->map(fn ($status) => [
            'status' => $status,
            'count'  => (int) ($rows->get($status)?->count ?? 0),
        ]);

        $total      = $funnel->sum('count');
        $paidCount  = (int) ($rows->get(Order::STATUS_PAID)?->count ?? 0);

        return response()->json([
            'data' => $funnel,
            'meta' => [
                'date_from'        => $from->toDateString(),
                'date_to'          => $to->toDateString(),
                'total_orders'     => $total,
                'completion_rate'  => $total > 0
                    ? round($paidCount / $total * 100, 1)
                    : 0.0,
            ],
        ]);
    }

    // ─── Payment Breakdown ────────────────────────────────────────────────────

    /**
     * GET /api/v1/analytics/payment-breakdown
     *
     * Revenue split by payment method (cash, M-Pesa, external, etc.)
     *
     * Query params:
     *   date_from   Y-m-d
     *   date_to     Y-m-d
     */
    public function paymentBreakdown(Request $request): JsonResponse
    {
        $this->validateDateRange($request);

        $tenantId    = $request->tenant()->id;
        [$from, $to] = $this->dateRange($request);

        $rows = DB::table('payments')
            ->selectRaw('method, COUNT(*) AS transactions, SUM(amount) AS total')
            ->where('tenant_id', $tenantId)
            ->where('status', Payment::STATUS_COMPLETED)
            ->whereBetween('paid_at', [$from, $to])
            ->groupBy('method')
            ->orderByRaw('total DESC')
            ->get();

        $grandTotal = $rows->sum('total');

        $data = $rows->map(fn ($r) => [
            'method'       => $r->method,
            'transactions' => (int) $r->transactions,
            'total'        => round((float) $r->total, 2),
            'share_pct'    => $grandTotal > 0
                ? round($r->total / $grandTotal * 100, 1)
                : 0.0,
        ]);

        return response()->json([
            'data' => $data,
            'meta' => [
                'date_from'   => $from->toDateString(),
                'date_to'     => $to->toDateString(),
                'grand_total' => round((float) $grandTotal, 2),
            ],
        ]);
    }

    // ─── Table Occupancy ─────────────────────────────────────────────────────

    /**
     * GET /api/v1/analytics/table-occupancy
     *
     * Per-table session count, total covers served, and average session duration.
     * Helps identify underused tables and peak capacity.
     *
     * Query params:
     *   date_from   Y-m-d
     *   date_to     Y-m-d
     */
    public function tableOccupancy(Request $request): JsonResponse
    {
        $this->validateDateRange($request);

        $tenantId    = $request->tenant()->id;
        [$from, $to] = $this->dateRange($request);

        $rows = DB::table('table_sessions')
            ->join('tables', 'table_sessions.table_id', '=', 'tables.id')
            ->selectRaw('
                tables.id AS table_id,
                tables.label AS table_label,
                tables.capacity,
                COUNT(table_sessions.id) AS sessions,
                SUM(table_sessions.covers) AS total_covers,
                AVG(
                    EXTRACT(EPOCH FROM (
                        COALESCE(table_sessions.closed_at, NOW()) - table_sessions.opened_at
                    )) / 60
                )::int AS avg_duration_min
            ')
            ->where('table_sessions.tenant_id', $tenantId)
            ->whereBetween('table_sessions.opened_at', [$from, $to])
            ->groupBy('tables.id', 'tables.label', 'tables.capacity')
            ->orderByRaw('sessions DESC')
            ->get()
            ->map(fn ($r) => [
                'table_id'         => $r->table_id,
                'table_label'      => $r->table_label,
                'capacity'         => (int) $r->capacity,
                'sessions'         => (int) $r->sessions,
                'total_covers'     => (int) $r->total_covers,
                'avg_duration_min' => (int) $r->avg_duration_min,
            ]);

        return response()->json([
            'data' => $rows,
            'meta' => [
                'date_from'      => $from->toDateString(),
                'date_to'        => $to->toDateString(),
                'total_sessions' => $rows->sum('sessions'),
                'total_covers'   => $rows->sum('total_covers'),
            ],
        ]);
    }

    // ─── CSV Export ───────────────────────────────────────────────────────────

    /**
     * GET /api/v1/analytics/export
     *
     * Download any of the analytics reports as a CSV file.
     *
     * Query params:
     *   report      'revenue' | 'top-items' | 'hourly-orders' | 'status-funnel'
     *               | 'payment-breakdown' | 'table-occupancy'  (required)
     *   date_from   Y-m-d
     *   date_to     Y-m-d
     *   + all report-specific params (limit, sort, granularity…)
     */
    public function export(Request $request): Response
    {
        $request->validate([
            'report' => 'required|in:revenue,top-items,hourly-orders,status-funnel,payment-breakdown,table-occupancy',
        ]);

        $report = $request->string('report');

        // Fetch data from the appropriate method (returns JsonResponse)
        $json = match ((string) $report) {
            'revenue'           => $this->revenue($request),
            'top-items'         => $this->topItems($request),
            'hourly-orders'     => $this->hourlyOrders($request),
            'status-funnel'     => $this->statusFunnel($request),
            'payment-breakdown' => $this->paymentBreakdown($request),
            'table-occupancy'   => $this->tableOccupancy($request),
        };

        $payload = json_decode($json->getContent(), true);
        $rows    = $payload['data'] ?? [];

        if (empty($rows)) {
            return response('No data available for export.', 204);
        }

        // Build CSV
        $csv     = $this->arrayToCsv($rows);
        $filename = $report . '_' . now()->format('Y-m-d') . '.csv';

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control'       => 'no-cache, no-store, must-revalidate',
        ]);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    /**
     * Convert an array of associative arrays to a CSV string.
     */
    private function arrayToCsv(array $rows): string
    {
        if (empty($rows)) {
            return '';
        }

        $output = fopen('php://temp', 'r+');

        // Header row
        fputcsv($output, array_keys($rows[0]));

        // Data rows
        foreach ($rows as $row) {
            fputcsv($output, array_values($row));
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }
}

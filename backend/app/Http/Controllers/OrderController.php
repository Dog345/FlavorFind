<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\DarajaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * GET /api/orders
     * For KDS tablet and manager dashboard.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::latest();

        // KDS only wants active kitchen orders
        if ($request->boolean('kitchen')) {
            $query->forKitchen();
        }

        if ($request->filled('status')) {
            $query->where('order_status', $request->status);
        }

        if ($request->filled('mpesa_status')) {
            $query->where('mpesa_status', $request->mpesa_status);
        }

        $orders = $query->paginate(50);

        return response()->json($orders);
    }

    /**
     * POST /api/orders
     * Guest places an order. Creates order in "pending" state.
     * Payment is initiated separately via POST /api/payments/initiate.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'table_number'   => 'nullable|string|max:20',
            'items_json'     => 'required|array|min:1',
            'items_json.*.menu_item_id' => 'required|uuid',
            'items_json.*.name'         => 'required|string',
            'items_json.*.price'        => 'required|numeric|min:0',
            'items_json.*.quantity'     => 'required|integer|min:1',
            'total_amount'   => 'required|numeric|min:0',
            'customer_phone' => 'nullable|string|max:20',
            'notes'          => 'nullable|string|max:500',
        ]);

        $order = Order::create([
            'tenant_id'      => $request->tenant()->id,
            'table_number'   => $request->table_number,
            'items_json'     => $request->items_json,
            'total_amount'   => $request->total_amount,
            'customer_phone' => $request->customer_phone,
            'notes'          => $request->notes,
            'mpesa_status'   => Order::MPESA_PENDING,
            'order_status'   => Order::STATUS_RECEIVED,
        ]);

        return response()->json([
            'order_id'     => $order->id,
            'total_amount' => $order->total_amount,
            'status'       => $order->mpesa_status,
            'message'      => 'Order created. Proceed to payment.',
        ], 201);
    }

    /**
     * GET /api/orders/{id}
     */
    public function show(string $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        return response()->json($order);
    }

    /**
     * PATCH /api/orders/{id}/status
     * KDS updates kitchen order status: received → prep → ready → completed
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:received,prep,ready,completed',
        ]);

        $order = Order::findOrFail($id);
        $order->update(['order_status' => $request->status]);

        // Broadcast to connected KDS displays via Reverb WebSocket
        // event(new OrderStatusUpdated($order));

        return response()->json([
            'id'           => $order->id,
            'order_status' => $order->order_status,
        ]);
    }
}

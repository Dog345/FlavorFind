<?php

use App\Models\Order;
use App\Models\TableSession;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels (Laravel Reverb / WebSockets)
|--------------------------------------------------------------------------
|
| All private/presence channels must be authorised here.
| The channel name convention uses the tenant slug as prefix so that
| different tenants cannot eavesdrop on each other:
|
|   {slug}.kitchen              – kitchen display listens for new orders
|   {slug}.orders.{orderId}     – waiter / customer tracks a specific order
|   {slug}.table.{tableId}      – floor plan updates for a table
|   {slug}.dashboard            – manager/admin live stats
|
*/

/**
 * Kitchen display channel — all kitchen and above staff.
 *
 * Channel: {slug}.kitchen
 */
Broadcast::channel('{slug}.kitchen', function ($user, string $slug) {
    // User must belong to the same tenant and have kitchen role or above
    if (! $user || $user->tenant->slug !== $slug) {
        return false;
    }

    return in_array($user->role, [
        \App\Models\User::ROLE_KITCHEN,
        \App\Models\User::ROLE_WAITER,
        \App\Models\User::ROLE_CASHIER,
        \App\Models\User::ROLE_MANAGER,
        \App\Models\User::ROLE_ADMIN,
    ], true);
});

/**
 * Order-specific channel — assigned waiter or management.
 *
 * Channel: {slug}.orders.{orderId}
 */
Broadcast::channel('{slug}.orders.{orderId}', function ($user, string $slug, string $orderId) {
    if (! $user || $user->tenant->slug !== $slug) {
        return false;
    }

    // Managers, admins, and the waiter who owns the order may subscribe
    if (in_array($user->role, [
        \App\Models\User::ROLE_MANAGER,
        \App\Models\User::ROLE_ADMIN,
        \App\Models\User::ROLE_CASHIER,
    ], true)) {
        return true;
    }

    $order = Order::where('tenant_id', $user->tenant_id)->find($orderId);

    return $order && $order->waiter_id === $user->id;
});

/**
 * Table-level channel — any staff at the same tenant.
 *
 * Channel: {slug}.table.{tableId}
 */
Broadcast::channel('{slug}.table.{tableId}', function ($user, string $slug, string $tableId) {
    if (! $user || $user->tenant->slug !== $slug) {
        return false;
    }

    // Any active staff member may subscribe
    return $user->is_active;
});

/**
 * Manager dashboard channel — restricted to managers and admins.
 *
 * Channel: {slug}.dashboard
 */
Broadcast::channel('{slug}.dashboard', function ($user, string $slug) {
    if (! $user || $user->tenant->slug !== $slug) {
        return false;
    }

    return in_array($user->role, [
        \App\Models\User::ROLE_MANAGER,
        \App\Models\User::ROLE_ADMIN,
    ], true);
});

/**
 * Tables / floor plan channel — all staff see live table status changes.
 *
 * Channel: {slug}.tables
 * Broadcasts: TableStatusChanged
 */
Broadcast::channel('{slug}.tables', function ($user, string $slug) {
    if (! $user || $user->tenant->slug !== $slug || ! $user->is_active) {
        return false;
    }

    // Any active staff member may watch the floor plan
    return true;
});

/**
 * Payments channel — cashiers and managers see live payment events.
 *
 * Channel: {slug}.payments
 * Broadcasts: PaymentReceived
 */
Broadcast::channel('{slug}.payments', function ($user, string $slug) {
    if (! $user || $user->tenant->slug !== $slug) {
        return false;
    }

    return in_array($user->role, [
        \App\Models\User::ROLE_CASHIER,
        \App\Models\User::ROLE_MANAGER,
        \App\Models\User::ROLE_ADMIN,
    ], true);
});

/**
 * Session channel — staff assigned to or managing a session.
 *
 * Channel: {slug}.session.{sessionId}
 */
Broadcast::channel('{slug}.session.{sessionId}', function ($user, string $slug, string $sessionId) {
    if (! $user || $user->tenant->slug !== $slug || ! $user->is_active) {
        return false;
    }

    $session = TableSession::where('tenant_id', $user->tenant_id)->find($sessionId);

    if (! $session) {
        return false;
    }

    // Waiter who owns the session, or management
    if (in_array($user->role, [
        \App\Models\User::ROLE_MANAGER,
        \App\Models\User::ROLE_ADMIN,
        \App\Models\User::ROLE_CASHIER,
    ], true)) {
        return true;
    }

    return $session->waiter_id === $user->id;
});

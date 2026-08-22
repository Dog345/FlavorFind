# Chef Kitchen Display System (KDS) — Frontend Build Prompt

## Overview
Build a dedicated Kitchen Display System (KDS) as a standalone React application optimized for use on kitchen screens, tablets, and wall-mounted displays. This app is used exclusively by kitchen staff (chefs, cooks) to see incoming orders in real time, manage item preparation, and communicate order readiness to waiters.

It is separate from the manager dashboard — simpler, focused, and optimized for speed in a loud, hot kitchen environment where staff may have gloved hands and poor lighting.

The user will share a design image — use it as the visual reference for colors, layout style, and typography. The KDS typically uses a **dark background** with high-contrast text and large touch targets. Follow that design closely.

---

## Tech Stack
- **React 18** with Vite
- **TailwindCSS** for styling
- **Zustand** for state (auth, order queue)
- **TanStack Query (React Query v5)** for API calls
- **Laravel Echo + Pusher JS** for real-time WebSocket
- **Axios** for HTTP
- **react-hot-toast** for sound/visual alerts on new orders
- **Lucide React** for icons
- **date-fns** for time formatting

---

## API Configuration

**Base URL**: `VITE_API_URL` env variable

Every request must include:
```
Authorization: Bearer {token}
X-Tenant-Slug: {tenant_slug}
Content-Type: application/json
Accept: application/json
```

**WebSocket**: Laravel Reverb (Pusher-compatible)
- Env vars: `VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT`, `VITE_REVERB_SCHEME`
- Channel: `private-tenant.{tenantId}`

---

## Auth Flow

### Login Page (`/login`)
- Minimal login form — email + password
- On success: store token, user (name, role), tenant (id, name, slug) in Zustand + localStorage
- Only `kitchen`, `waiter`, `manager`, and `admin` roles can access the KDS
- Redirect to `/kitchen` after login

**POST** `/api/v1/auth/login`
```json
{ "email": "...", "password": "..." }
```

On 401 anywhere — redirect back to login.

---

## Application Structure

The KDS is a single focused screen with minimal navigation:

```
/login     — login page
/kitchen   — main KDS board (default route after login)
/ready     — orders marked ready, waiting for pickup by waiters (optional secondary view)
```

No sidebar needed. Top bar only with: hotel name/logo, current time (live clock), logged-in user name, logout button, and a fullscreen toggle.

---

## Main KDS Board (`/kitchen`)

This is the primary and most important screen. Every design decision must prioritize **speed**, **clarity**, and **minimal interaction required**.

### Layout

**Full-screen card grid** — responsive columns:
- Desktop (≥1280px): 4 columns
- Tablet (≥768px): 2–3 columns
- Mobile: 1 column

Cards are sorted **oldest first** (FIFO — first in, first out). The longest-waiting order is always top-left.

### Order Card Design

Each card represents one order. Cards should be large, with generous padding and high-contrast text.

**Card header** (prominent):
- Order number (e.g. `#0042`) — very large font
- Table label (e.g. `Table 5`) — large font
- **Age timer** — live countdown showing how long ago the order was placed:
  - `< 10 min` → green text
  - `10–20 min` → orange/amber text
  - `> 20 min` → red text, pulsing animation
- Order notes (if any) — amber highlight box below header

**Card body** — item list:
Each item shown as a row:
- Quantity badge (e.g. `×2`)
- Item name — large, clear
- Variant (if any) — smaller text below name (e.g. "Large")
- Modifiers list (if any) — small text, slightly dimmed (e.g. "+ Extra cheese, - No onions")
- Special notes per item — italic, amber text
- **Item status button** (right side of row):
  - `pending` → "Start" button (blue/gray) → tapping sets status to `preparing`
  - `preparing` → "Done" button (orange) → tapping sets status to `ready`
  - `ready` → green checkmark indicator (no button — item is done)

**Card footer**:
- If ALL items are `ready` OR `preparing/ready`: show **"Mark Order Ready"** button prominently (green, full-width)
  - Tapping this marks the entire order status as `ready` → card moves to "Ready for pickup" state or is removed from the board
- Cover count (how many guests) — shown small in footer

### Card States / Visual Differentiation

Cards change appearance based on progress:
- **New** (all items pending): full card highlight or border glow (e.g. blue border)
- **In progress** (some items preparing): normal card
- **Almost done** (all items ready): green border glow, card slightly fades
- Orders that are `ready` (full order): either removed from the main board or moved to a "Ready" section at the bottom

---

## Item Status Updates

**Tap "Start" on an item**:
```
PATCH /api/v1/orders/{orderId}/items/{itemId}/status
{ "status": "preparing" }
```
Update the card UI immediately (optimistic update).

**Tap "Done" on an item**:
```
PATCH /api/v1/orders/{orderId}/items/{itemId}/status
{ "status": "ready" }
```

**Tap "Mark Order Ready"**:
```
PATCH /api/v1/orders/{orderId}/status
{ "status": "ready" }
```
This signals to the manager dashboard and waiter that the food is ready for pickup. Remove the card from the active board (or visually dim it and move to a "Ready" section).

---

## Real-Time WebSocket

This is the most critical feature of the KDS. Orders must appear on screen the moment they are placed — without any manual refresh.

```js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;
const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
  wssPort: import.meta.env.VITE_REVERB_PORT,
  forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
  authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-Slug': tenantSlug,
    },
  },
});

echo.private(`tenant.${tenantId}`)
  .listen('OrderPlaced', (e) => {
    // Add new order card to the board — show alert sound/flash
    addOrderToQueue(e.order);
  })
  .listen('OrderCreated', (e) => {
    // Same as above (backward compat — backend fires both)
    addOrderToQueue(e.order);
  })
  .listen('OrderStatusUpdated', (e) => {
    // If status is cancelled → remove card
    // If status is ready/served/paid → remove from active board
    updateOrderStatus(e.order);
  })
  .listen('OrderItemStatusUpdated', (e) => {
    // Update individual item status within a card
    updateItemStatus(e.item);
  });
```

**Fallback polling**: If WebSocket disconnects, poll `GET /api/v1/orders/kitchen` every 15 seconds. Show a "⚠️ Live updates paused — reconnecting..." banner when WebSocket is disconnected.

**New order alert**: When a new order arrives via WebSocket:
- Play a short audio chime (use Web Audio API to generate a simple beep — no external audio files needed)
- Flash the new card with a highlight animation for 2 seconds
- Show a toast: "New order: #0042 — Table 5"

---

## Data Fetching

**Initial load**: `GET /api/v1/orders/kitchen`

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "order_number": "#0042",
      "status": "confirmed",
      "notes": "No nuts please",
      "created_at": "2026-08-22T10:30:00Z",
      "table": { "id": "uuid", "label": "Table 5" },
      "items": [
        {
          "id": "uuid",
          "name": "Nyama Choma",
          "quantity": 2,
          "unit_price": 850.00,
          "status": "pending",
          "modifiers": [{"name": "Extra kachumbari", "price_delta": 0}],
          "notes": "Well done"
        }
      ]
    }
  ]
}
```

The kitchen endpoint returns only orders with status `confirmed` or `preparing` — orders the kitchen needs to act on.

---

## Secondary View: Ready for Pickup (`/ready`)

Optional secondary screen (or a tab/section on the main board) showing orders that have been marked `ready` by the kitchen, waiting to be picked up by waiters.

- Simpler layout — just shows order number and table label
- Each card has a "Picked Up / Served" button → calls `PATCH /api/v1/orders/{id}/status` with `{ status: "served" }`
- Once served, the card disappears

This can be a secondary tab within the main KDS board rather than a separate route.

---

## UX Requirements

1. **Touch-first**: All buttons must be minimum 48×48px touch targets. Kitchen staff may have gloved hands.
2. **High contrast**: White text on dark backgrounds. Status colors must be visible under kitchen lighting (avoid pastels).
3. **No small text**: Minimum 14px for secondary info, 18px+ for item names, 28px+ for order numbers.
4. **Fast**: No unnecessary animations. Interactions must feel instant with optimistic UI updates.
5. **No page reloads**: Everything updates in-place via WebSocket and React Query cache.
6. **Fullscreen mode**: A button to enter browser fullscreen for wall-mounted displays.
7. **Auto-reconnect**: WebSocket must auto-reconnect with exponential backoff if the connection drops.
8. **Live clock**: Show current time in the top bar, updating every second.
9. **Empty state**: When no active orders, show a clean "Kitchen clear — no pending orders 🍽️" message.
10. **Error handling**: If an API call fails (e.g. item status update), show a toast error and revert the optimistic update.

---

## Project Structure
```
src/
  api/
    auth.js          # login, logout
    orders.js        # kitchen queue, status updates
  components/
    OrderCard.jsx    # individual order card with all item rows
    ItemRow.jsx      # single item with status button
    TimerBadge.jsx   # live elapsed time with color coding
    WebSocketStatus.jsx  # connection indicator
    TopBar.jsx       # clock, user, fullscreen, logout
  stores/
    authStore.js     # token, user, tenant
    kitchenStore.js  # order queue, WebSocket state
  hooks/
    useKitchenQueue.js   # TanStack Query + WebSocket merging
    useWebSocket.js      # Echo setup, auto-reconnect
    useLiveClock.js      # live time
  pages/
    LoginPage.jsx
    KitchenPage.jsx
  router.jsx
  main.jsx
```

---

## Environment Variables (`.env`)
```
VITE_API_URL=https://api.hotel.flavorfind.co.ke
VITE_REVERB_APP_KEY=your-app-key
VITE_REVERB_HOST=api.hotel.flavorfind.co.ke
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

---

## Important Notes

- **All IDs are UUIDs** (strings). Never treat them as integers.
- **X-Tenant-Slug header is required on every request** — stored from login response.
- **Order item statuses are forward-only**: `pending → preparing → ready`. Never go backward.
- **Kitchen only sees `confirmed` and `preparing` orders**. The backend filters this automatically via `GET /api/v1/orders/kitchen`.
- **Item modifiers** are stored as a JSON array: `[{ "name": "Extra cheese", "price_delta": 50 }]`. Display only the `name` in the KDS — price is not relevant in the kitchen.
- **`order.notes`** is the overall order note (e.g. "allergic to peanuts"). **`item.notes`** is per-item (e.g. "well done"). Both must be clearly displayed.
- The KDS app is intentionally **lightweight** — no analytics, no menu management, no payments. One job: show orders, update statuses.

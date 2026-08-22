# Hotel Manager Dashboard — Frontend Build Prompt

## Overview
Build a complete hotel/restaurant manager dashboard as a single-page React application. This is the primary management interface used by admins, managers, cashiers, and waiters to run day-to-day operations of a restaurant. It must be fully functional, production-ready, and connect to a live REST API.

The user will share a design image — use it as the visual reference for colors, layout style, typography, and component design. Follow that design closely but ensure every screen described below is fully implemented.

---

## Tech Stack
- **React 18** with Vite
- **TailwindCSS** for styling
- **React Router v6** for navigation
- **Zustand** for global state (auth, tenant, websocket)
- **TanStack Query (React Query v5)** for all API calls — fetching, caching, mutations, optimistic updates
- **Recharts** for all charts and analytics graphs
- **Axios** for HTTP — set base URL from `VITE_API_URL` env var
- **react-hot-toast** for notifications
- **Lucide React** for icons
- **Laravel Echo + Pusher JS** for real-time WebSocket updates

---

## API Configuration

**Base URL**: `VITE_API_URL` env variable (e.g. `https://api.hotel.flavorfind.co.ke`)

**Authentication**: Laravel Sanctum — Bearer token stored in localStorage.

Every API request must include:
```
Authorization: Bearer {token}
X-Tenant-Slug: {tenant.slug}   ← from stored tenant info after login
Content-Type: application/json
Accept: application/json
```

**WebSocket**: Laravel Reverb (compatible with Pusher JS)
- `VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT`, `VITE_REVERB_SCHEME` env vars
- Listen to tenant-scoped private channels: `private-tenant.{tenantId}`

---

## Auth Flow

### Login Page (`/login`)
- Email + password form
- On success: store `token`, `user` (id, name, email, role), `tenant` (id, name, slug, logo_url, primary_color) in Zustand + localStorage
- Redirect to dashboard
- Show error toast on invalid credentials

**POST** `/api/v1/auth/login`
```json
{ "email": "...", "password": "..." }
```
Response: `{ token, user: { id, name, email, role }, tenant: { id, name, slug, logo_url } }`

### Logout
**POST** `/api/v1/auth/logout` → clear store → redirect to `/login`

### Route Guard
- All routes except `/login` require a valid token
- On 401 response, clear auth and redirect to login

---

## Role System
Users have one of these roles. The UI must hide/show features accordingly:
- `admin` — full access to everything
- `manager` — full access except some admin-only destructive actions
- `waiter` — orders, tables, KDS view only
- `kitchen` — KDS only
- `cashier` — orders + payments only

---

## Navigation Structure

**Sidebar navigation** (collapsible on mobile):
```
🏠 Dashboard          — all roles
📋 Orders             — all roles
🍳 Kitchen (KDS)      — all roles (primary view for kitchen role)
🪑 Tables             — admin, manager, waiter
📅 Reservations       — admin, manager, waiter
🍽️  Menu              — admin, manager
💳 Payments           — admin, manager, cashier
📊 Analytics          — admin, manager
⚙️  Settings           — admin, manager
   ├── Staff
   ├── Floors & Tables
   ├── Tenant Info
   └── Upsell Rules
```

---

## Screen Specifications

---

### 1. Dashboard (`/`)

A summary of today's operations at a glance.

**Top KPI cards** (4 cards in a row):
- Today's Revenue (sum of completed payments today)
- Orders Today (count)
- Active Tables (tables with open sessions)
- Pending Orders (orders with status `pending` or `confirmed`)

**Data sources**:
- `GET /api/v1/tenant/stats` → returns `{ revenue_today, orders_today, active_sessions, pending_orders }`

**Charts**:
- Revenue bar chart (last 7 days) — `GET /api/v1/analytics/revenue?granularity=day&date_from=...`
- Order status funnel (today) — `GET /api/v1/analytics/status-funnel?date_from=today`
- Payment method breakdown (pie/donut) — `GET /api/v1/analytics/payment-breakdown`

**Recent orders** table — last 10 orders with table, status badge, total, time — `GET /api/v1/orders?limit=10`

---

### 2. Orders (`/orders`)

Full order management list.

**Filters**: status (all/pending/confirmed/preparing/ready/served/paid/cancelled), date picker, table selector

**Order table columns**: Order#, Table, Waiter, Items count, Total, Status badge, Created time, Actions

**Status badges** with colors:
- `pending` → yellow
- `confirmed` → blue
- `preparing` → orange
- `ready` → purple
- `served` → teal
- `paid` → green
- `cancelled` → red/gray

**Actions per order**:
- View details (drawer/modal showing all items, modifiers, notes, payment status)
- Update status → `PATCH /api/v1/orders/{id}/status` with `{ status }`
- Cancel → `POST /api/v1/orders/{id}/cancel`
- Take payment (opens payment modal) — for orders with status `served`

**New Order button** (admin/manager/waiter):
Opens a modal to create an order:
1. Select active table session (list open sessions)
2. Browse menu items by category, search
3. Add items with quantity, variant selection, modifiers, notes
4. Submit → `POST /api/v1/orders`

**Real-time**: Listen to WebSocket event `OrderPlaced`, `OrderStatusUpdated` on `private-tenant.{tenantId}` — auto-refresh order list when events fire.

**API**:
- `GET /api/v1/orders` (paginated, filterable)
- `POST /api/v1/orders`
- `PATCH /api/v1/orders/{id}/status`
- `POST /api/v1/orders/{id}/cancel`

---

### 3. Kitchen Display (KDS) (`/kitchen`)

Real-time kitchen view. Full-screen optimized. Dark background. Primary screen for `kitchen` role.

**Layout**: Card grid of active orders (status: `confirmed` or `preparing`). Oldest orders shown first (FIFO).

**Each order card shows**:
- Order number + table label (large, prominent)
- Time since order placed (live timer, color changes: green < 10 min, orange 10–20 min, red > 20 min)
- Each item line with: name, quantity, modifiers, special notes
- Item-level status buttons: `pending → preparing → ready`
- Order-level action: "Mark Ready" button (marks entire order as `ready`)

**Item status update**: `PATCH /api/v1/orders/{id}/items/{itemId}/status`
**Order status update**: `PATCH /api/v1/orders/{id}/status`

**Real-time**: Subscribe to `private-tenant.{tenantId}` WebSocket channel:
- `OrderPlaced` / `OrderCreated` → add new order card
- `OrderStatusUpdated` → update or remove card
- `OrderItemStatusUpdated` → update item status within card

**API**: `GET /api/v1/orders/kitchen`

Auto-refresh every 30 seconds as fallback.

---

### 4. Tables (`/tables`)

Visual floor plan of all tables grouped by floor.

**Floor tabs** at top — one tab per floor (from `GET /api/v1/floors`)

**Table cards** in a grid:
- Table label (e.g. "T-01")
- Capacity (e.g. "4 pax")
- Status badge: `available` (green), `occupied` (red), `reserved` (yellow), `unavailable` (gray)
- If occupied: show session duration + cover count
- Actions:
  - Available table: "Open Session" button → modal asking for covers count → `POST /api/v1/tables/{id}/open`
  - Occupied table: "View Orders" → shows orders for current session, "Close Session" → `POST /api/v1/tables/{id}/close`
  - Reserved table: "Mark Arrived" → links to reservation flow

**Real-time updates** via WebSocket for table status changes.

**API**:
- `GET /api/v1/floors`
- `GET /api/v1/tables` (with `floor_id` filter)
- `POST /api/v1/tables/{id}/open` → `{ covers: int }`
- `POST /api/v1/tables/{id}/close`

---

### 5. Reservations (`/reservations`)

Reservation management with calendar view.

**Views**: List view (default) + Day view (shows time slots for a selected date)

**List filters**: status (all/tentative/confirmed/arrived/no_show/cancelled/completed), date picker, upcoming toggle

**Reservation card/row**: Guest name, phone, covers, date+time, table, status badge, duration, source badge (walk_in/phone/online/app)

**Actions per reservation**:
- View/Edit → `PUT /api/v1/reservations/{id}`
- Confirm → `POST /api/v1/reservations/{id}/confirm`
- Mark Arrived → `POST /api/v1/reservations/{id}/arrive` (opens session, returns session token)
- Cancel → `POST /api/v1/reservations/{id}/cancel`
- No Show → `PATCH /api/v1/reservations/{id}/no-show`

**New Reservation modal**:
1. Guest name, phone, email (optional)
2. Covers, date + time, duration (default 90 min)
3. Source (walk_in/phone/online/app)
4. Notes
5. Table assignment: show availability → `GET /api/v1/reservations/availability?date=...&time=...&covers=...` → select from available tables OR toggle auto-assign
6. Submit → `POST /api/v1/reservations`

**Availability checker**: Live check as user changes date/time/covers — show available tables immediately.

---

### 6. Menu Management (`/menu`)

Full CRUD for the restaurant menu.

**Categories tab**:
- List of categories with item count, sort order, active toggle
- Add/Edit/Delete category
- `GET /api/v1/menu/categories`
- `POST /api/v1/menu/categories`
- `PUT /api/v1/menu/categories/{id}`
- `DELETE /api/v1/menu/categories/{id}`

**Items tab**:
- Grid or list of menu items with image, name, category, price, availability toggle
- Filter by category, search by name
- Add/Edit item form: name, description, category, base_price, image_url, is_available, is_featured, prep_time_min, tags, allergens
- Each item can have **Variants** (e.g. Small/Large with different prices) and **Modifiers** (e.g. Extra cheese +50)
- Variant management: `GET/POST/PUT/DELETE /api/v1/menu/items/{id}/variants`
- Modifier management: `GET/POST/PUT/DELETE /api/v1/menu/items/{id}/modifiers`

---

### 7. Payments (`/payments`)

Payment listing and reconciliation.

**Payments table**: Order#, Amount, Method badge (cash/mpesa/external), Status badge, Paid at, Staff

**Filters**: method, status, date range

**Cash Payment modal** (from an order):
```
POST /api/v1/orders/{orderId}/payments/cash
{ "amount_tendered": 2000, "notes": "..." }
```
Response includes change amount — show it prominently.

**External Payment modal**:
```
POST /api/v1/orders/{orderId}/payments/external
{ "amount": 1500, "provider": "Equity", "reference": "TXN123", "notes": "..." }
```

**M-Pesa Payment** (manager view — show status):
- Initiate: `POST /api/v1/orders/{orderId}/payments/mpesa` with `{ phone: "254712..." }`
- Poll status: `GET /api/v1/payments/{paymentId}/status` every 3s until completed/failed/timeout

**Reconciliation report**: `GET /api/v1/payments/reconciliation`
Shows totals by method, shift summary.

**Export**: Download button → triggers CSV export.

---

### 8. Analytics (`/analytics`)

Data visualization dashboard. Admin/manager only.

**Date range picker** (default: last 30 days). Apply button updates all charts.

**Charts**:

1. **Revenue over time** — line/bar chart with day/week/month toggle
   `GET /api/v1/analytics/revenue?date_from=...&date_to=...&granularity=day`

2. **Top selling items** — horizontal bar chart, sortable by revenue or quantity
   `GET /api/v1/analytics/top-items?limit=10&sort=revenue`

3. **Hourly orders heatmap** — bar chart showing order volume by hour (0–23)
   `GET /api/v1/analytics/hourly-orders`

4. **Order status funnel** — funnel/bar showing pending → paid conversion
   `GET /api/v1/analytics/status-funnel`

5. **Payment breakdown** — donut chart: cash vs M-Pesa vs external %
   `GET /api/v1/analytics/payment-breakdown`

6. **Table occupancy** — table showing sessions, covers, avg duration per table
   `GET /api/v1/analytics/table-occupancy`

7. **Upsell performance** — conversion rate by rule and by source (manual vs AI)
   `GET /api/v1/upsell-rules/analytics`

**Export buttons** on each report → `GET /api/v1/analytics/export?report=revenue&date_from=...`

---

### 9. Settings

#### Staff Management (`/settings/staff`) — admin/manager
- Staff list: name, email, role badge, active status, last login
- Add Staff: name, email, role, phone, password → `POST /api/v1/staff`
- Edit: update name, phone, active status → `PUT /api/v1/staff/{id}`
- Change role → `PATCH /api/v1/staff/{id}/role`
- Remove → `DELETE /api/v1/staff/{id}`

#### Floors & Tables (`/settings/floors`) — admin/manager
- List floors, add/edit/delete floor → `GET/POST/PUT/DELETE /api/v1/floors`
- Per floor: list tables, add/edit/delete table → `GET/POST/PUT/DELETE /api/v1/tables`
- Table fields: label, capacity, floor, status

#### Tenant Settings (`/settings/tenant`) — admin only
- Hotel name, slug, logo URL, primary color
- `GET /api/v1/tenant` + `PUT /api/v1/tenant`

#### Upsell Rules (`/settings/upsell`) — admin/manager
- List rules showing trigger item → suggested item, prompt text, priority, active toggle, conversion rate
- Add/Edit/Delete rules → `GET/POST/PUT/DELETE /api/v1/upsell-rules`
- Show upsell analytics inline: impressions, acceptance rate per rule
- `GET /api/v1/upsell-rules/analytics`

---

## Real-time WebSocket Setup

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

// Listen on the tenant's private channel
echo.private(`tenant.${tenantId}`)
  .listen('OrderPlaced', (e) => { /* refresh orders */ })
  .listen('OrderStatusUpdated', (e) => { /* update order card */ })
  .listen('OrderItemStatusUpdated', (e) => { /* update item in KDS */ })
  .listen('ReservationUpdated', (e) => { /* refresh reservations */ })
  .listen('PaymentReceived', (e) => { /* update payment status */ });
```

---

## Key UX Requirements

1. **Optimistic updates**: When a waiter clicks "Mark Preparing" on an order, update the UI immediately before the API response.
2. **Loading skeletons**: Every data list shows skeleton loaders while fetching, not spinners.
3. **Empty states**: Meaningful empty state for every list (e.g. "No orders yet today").
4. **Toast notifications**: Success and error toasts for every mutation. Use react-hot-toast.
5. **Mobile responsive**: The sidebar collapses to a bottom tab bar on mobile. Tables and KDS must work on tablets.
6. **Confirmation dialogs**: Destructive actions (cancel order, remove staff, delete table) must show a confirmation modal.
7. **Role-based UI**: Hide entire menu sections and action buttons based on the logged-in user's role. Never just disable — fully hide.
8. **Pagination**: All lists use cursor/page-based pagination. Load more on scroll or page buttons.
9. **Date/time formatting**: All times shown in local timezone (Africa/Nairobi). Use `date-fns` or `dayjs`.
10. **Error boundary**: Wrap each major section in an error boundary with a retry button.

---

## Project Structure
```
src/
  api/           # axios instance + all API call functions grouped by domain
  components/    # shared UI components (Button, Badge, Modal, Skeleton, Table, etc.)
  features/      # feature folders: orders/, kitchen/, tables/, reservations/, menu/, payments/, analytics/, settings/
  hooks/         # custom hooks (useAuth, useTenant, useWebSocket)
  stores/        # zustand stores: authStore, tenantStore
  pages/         # route-level page components
  router.jsx     # React Router setup with route guards
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
- The API is **multi-tenant**. Every request MUST include `X-Tenant-Slug` header — the slug comes from the login response and is stored in the auth store.
- All IDs are UUIDs (strings), not integers.
- Monetary values are in **Kenyan Shillings (KES)**. Format as `KES 1,500.00`.
- The API returns paginated responses as `{ data: [...], links: {...}, meta: { current_page, last_page, total } }`.
- Some endpoints return `{ data: [...] }` (non-paginated collections).
- Order numbers are formatted as `#0001`, `#0002`, etc.
- Order statuses in sequence: `pending → confirmed → preparing → ready → served → paid` (or `cancelled` from most states).
- Item statuses: `pending → preparing → ready` (forward-only in KDS).

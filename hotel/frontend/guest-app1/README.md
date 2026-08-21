# Mamba Hotel — Guest Ordering PWA

A mobile-first Progressive Web App for hotel restaurant guests. Guests scan a QR code at their table, browse the menu, place orders, track cooking progress, and pay via M-Pesa — no app download, no login.

Built to match the reference design: warm cream backgrounds, a serif display face for names and prices, circular/rounded food imagery, and a coral accent that's actually driven by the hotel's own brand color at runtime.

## Tech stack

- React 18 + Vite (client-side only, no SSR)
- Tailwind CSS v3
- Zustand (cart + session state)
- TanStack Query (server-state caching, 5-minute staleTime on menu data)
- Axios
- React Router v6
- Framer Motion (page transitions, cart badge bounce, bottom sheets, confetti)
- Lucide React (icons)
- React Hot Toast (order placed / payment sent / errors)
- vite-plugin-pwa (offline app-shell + menu caching via a service worker)

## Getting started

```bash
npm install
cp .env.example .env
# edit .env if your backend isn't on localhost:8000
npm run dev
```

The app expects a backend at `VITE_API_BASE_URL` (default `http://localhost:8000`) implementing the `/api/v1/guest/{token}/...` endpoints described below. With the Mamba Hotel seeder already run, use one of these to test locally:

- Table T1: `http://localhost:5173/table/mamba-table-1-token-0000000000001`
- Table T2: `http://localhost:5173/table/mamba-table-2-token-0000000000002`

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally

## Project structure

```
src/
├── api/guest.js          # every network call, scoped by QR token
├── components/
│   ├── ui/                # Button, Badge, Skeleton, Modal (bottom-sheet shell)
│   ├── layout/             # Header, BottomNav, GuestLayout (shared shell)
│   ├── menu/                # SearchBar, CategoryTabs, MenuItemCard, ItemDetailSheet
│   ├── cart/                # CartItem, OrderSummary, CartDrawer
│   ├── order/                # OrderStatusBadge, OrderTracker
│   └── payment/              # PaymentSheet, PaymentPolling
├── pages/                # SplashPage, MenuPage, OrdersPage, PayPage
├── stores/                # sessionStore, cartStore (Zustand)
└── hooks/                # useSession, useMenu, useOrders, useUpsell
```

## How the pieces fit together

**Session.** The QR code points at `/table/:token`. `SplashPage` resolves the token via `GET /api/v1/guest/{token}`, stores the hotel/table/session data in `sessionStore`, and applies the hotel's `primary_color` as the `--color-primary` CSS variable — every accent in the app (buttons, active tab, tracker dots) reads from that one variable. A 404/410 response shows a terminal "ask your waiter" screen with no retry.

**Menu.** `MenuPage` fetches the categorized menu and popular items in parallel (cached 5 minutes via React Query). Category tabs scroll the page to an in-page anchor rather than navigating — everything lives on one scrollable page. Search is debounced 400ms and swaps the view to search results while focused.

**Cart.** Held entirely in `cartStore` (no backend round-trip until checkout). `CartDrawer` lazy-loads upsell suggestions only once it's opened, and posts the order on "Place Order," clearing the cart and routing to `/orders` on success.

**Orders.** `OrdersPage` lists this session's orders; expanding one starts 15-second polling on that order only (polling stops automatically once it reaches "served"). A toast fires the moment a tracked order flips to "ready."

**Payment.** `PayPage` shows the outstanding balance across all orders. Submitting the M-Pesa form polls every 3 seconds for up to 2 minutes, resolving into a confetti success state with a receipt, a failure state with retry, or a timeout state.

## Error handling

All API errors are mapped centrally in `src/api/guest.js` (`toFriendlyError`) and surfaced as toasts — raw error objects are never shown to the guest:

| Status | Message |
|---|---|
| 404 | Not found. Please try again. |
| 410 | This session has expired. Please ask your waiter. |
| 422 | First validation message from the response |
| 500 / 502 | Something went wrong on our end. Please try again in a moment. |
| network | Connection lost. Check your wifi and try again. |

## Accessibility

- Every interactive control has an `aria-label`
- Touch targets are ≥44×44px
- Bottom sheets (`Modal`) trap focus and close on Escape or backdrop tap
- `prefers-reduced-motion` is respected globally

## Notes on the API contract

`src/api/guest.js` assumes the following shapes (adjust the mapping there if your backend differs):

- `GET /{token}` → `{ session, table, hotel }`
- `GET /{token}/menu` → `{ categories: [{ id, name, items: [MenuItem] }] }`
- `GET /{token}/popular` → `{ items: [MenuItem] }`
- `GET /{token}/menu/search?q=` → `{ items: [MenuItem] }`
- `GET /{token}/upsell?item_ids[]=` → `{ items: [MenuItem] }`
- `POST /{token}/orders` → order confirmation
- `GET /{token}/orders` → `{ orders: [{ id, order_number, status, total, balance, item_count, created_at }] }`
- `GET /{token}/orders/{id}` → `{ status, items: [{ name, quantity, status }] }`
- `POST /{token}/payments/mpesa` → `{ payment_id }`
- `GET /{token}/payments/{id}/status` → `{ status, mpesa_code }`

`MenuItem` shape: `{ id, name, description, image_url, price, prep_time_minutes, tags: [], variants: [{ id, label, price }], modifiers: [{ id, name, price }] }`.

# Claude Prompt — Guest QR Ordering PWA (Hotel Restaurant)

---

## ROLE

You are a senior frontend engineer building a **mobile-first Progressive Web App (PWA)** for hotel restaurant guests. Guests scan a QR code at their table, open this app on their phone browser, browse the menu, place orders, track cooking progress, and pay via M-Pesa — all without downloading anything or logging in.

---

## DESIGN DIRECTION

**Study the reference video carefully before writing a single line of code.** Match the exact layout, spacing, font choices, colours, icon styles, animations and interaction patterns shown in the video. Where the video shows a specific UI element, replicate it precisely. Where the video is ambiguous, default to the principles below.

Design principles:
- Clean, modern, warm — not corporate
- Mobile-only (375px–430px viewport is primary)
- Dark header/nav, light content area, accent colour matches the hotel's `primary_color` (loaded from API)
- Large food imagery (full-width cards, 16:9 or 4:3 aspect ratio)
- Generous white space — nothing feels cramped
- Smooth transitions between screens (slide-in, fade)
- Tactile feel — buttons give visual feedback on tap (scale down 0.95, slight shadow change)

---

## TECH STACK

- **Framework**: React 18 + Vite (NOT Next.js — this is a pure client-side PWA)
- **Styling**: Tailwind CSS v3
- **State**: Zustand (cart store + session store)
- **HTTP**: Axios with a base URL pointing to the backend API
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Animations**: Framer Motion (page transitions, cart badge bounce, skeleton loaders)
- **PWA**: Vite PWA plugin (`vite-plugin-pwa`) with a service worker for offline menu caching
- **Notifications**: React Hot Toast (order placed, payment sent, errors)

Do NOT add: TypeScript, Redux, GraphQL, Next.js SSR, or any backend framework.

---

## PROJECT STRUCTURE

```
guest-app/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # App icons (192, 512)
├── src/
│   ├── api/
│   │   └── guest.js           # All API calls (Axios)
│   ├── components/
│   │   ├── ui/                # Reusable primitives
│   │   │   ├── Button.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   └── Modal.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx     # Hotel name + logo + cart icon
│   │   │   └── BottomNav.jsx  # Menu | Orders | Pay tabs
│   │   ├── menu/
│   │   │   ├── CategoryTabs.jsx
│   │   │   ├── MenuItemCard.jsx
│   │   │   ├── ItemDetailSheet.jsx   # Bottom sheet with full item details
│   │   │   └── SearchBar.jsx
│   │   ├── cart/
│   │   │   ├── CartDrawer.jsx        # Slides up from bottom
│   │   │   ├── CartItem.jsx
│   │   │   └── OrderSummary.jsx
│   │   ├── order/
│   │   │   ├── OrderTracker.jsx      # Status timeline
│   │   │   └── OrderStatusBadge.jsx
│   │   └── payment/
│   │       ├── PaymentSheet.jsx      # M-Pesa input + confirm
│   │       └── PaymentPolling.jsx    # Waiting animation
│   ├── pages/
│   │   ├── SplashPage.jsx     # QR token validation + loading
│   │   ├── MenuPage.jsx       # Main menu browsing
│   │   ├── OrdersPage.jsx     # My orders this session
│   │   └── PayPage.jsx        # Payment initiation
│   ├── stores/
│   │   ├── sessionStore.js    # Hotel info, table, token
│   │   └── cartStore.js       # Cart items, quantities
│   ├── hooks/
│   │   ├── useSession.js      # Fetch + cache session data
│   │   ├── useMenu.js         # Fetch menu, popular items
│   │   ├── useOrders.js       # Place + poll orders
│   │   └── useUpsell.js       # Fetch upsell suggestions
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## SCREENS (build in this order)

### Screen 1 — Splash / QR Validation

**Route**: `/table/:token` (this is the URL embedded in the QR code)

**What it does**:
1. Reads the `token` from the URL
2. Calls `GET /api/v1/guest/{token}` to validate
3. Shows a full-screen loading animation (hotel logo pulsing) while fetching
4. On success: stores session + hotel data in Zustand, redirects to `/menu`
5. On error (410 session closed, 404 invalid token): shows a friendly error screen with the message "This QR code is no longer active. Please ask your waiter for assistance." — no retry button, just the message and hotel branding

**Design notes**:
- Hotel logo centred on a dark background (use `primary_color` as background)
- Animated spinner or pulsing dots below the logo
- Smooth fade transition into the menu page

---

### Screen 2 — Menu Page (main screen)

**Route**: `/menu`

**Layout**:
```
┌─────────────────────────────┐
│  [Logo]  Mamba Hotel    🛒2 │  ← Header (sticky, dark bg)
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │   🔍  Search dishes...  │ │  ← Search bar
│ └─────────────────────────┘ │
│                             │
│  Starters  Mains  Sides ... │  ← Category tabs (horizontal scroll)
│  ─────────                  │  ← Active tab underline
│                             │
│  ┌─────────────────────┐    │
│  │  [image 16:9]       │    │  ← Menu item card
│  │  Grilled Tilapia    │    │
│  │  KES 1,200    [+ ]  │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  ...                │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
│   Menu  │  Orders  │  Pay   │  ← Bottom nav
└─────────────────────────────┘
```

**Behaviour**:
- On load: fetch full menu + popular items in parallel
- Popular items section appears FIRST (horizontal scroll row of cards) above the category tabs — labelled "🔥 Popular"
- Category tabs scroll horizontally; tapping one smoothly scrolls the item list to that section (in-page anchor scroll, NOT separate pages for each category)
- Each MenuItemCard shows: image, name, price, prep time, tags (spicy 🌶, vegan 🌿, popular 🔥, seafood 🐟, premium ⭐), and a [+] add button
- Tapping the card body (not the + button) opens the ItemDetailSheet
- The [+] button adds the item to cart immediately with a bounce animation on the cart badge
- Cart icon in header shows item count badge; tapping it opens the CartDrawer

**Search**:
- Typing in the search bar calls `GET /api/v1/guest/{token}/menu/search?q=...` with 400ms debounce
- Results replace the normal category view while the search bar has focus
- "No results" shows a friendly empty state with a fork illustration

**ItemDetailSheet** (bottom sheet, slides up):
- Full item image (top, 50% viewport height)
- Name, description, prep time
- Tags as coloured chips
- Variants section (if item has variants): radio buttons to select size/portion
- Modifiers section (if item has modifiers): checkboxes for add-ons with prices
- Special instructions text field (optional)
- Quantity selector (+/-)
- "Add to cart — KES X,XXX" button (full width, accent colour, sticky at bottom)

---

### Cart Drawer (slides up from bottom, covers ~85% of screen)

**Triggered by**: cart icon in header, or after adding item

**Contents**:
- "Your Order" title + close button
- List of cart items with quantity controls and remove button
- Subtotal, VAT (16%), Total
- Upsell row: "You might also like…" — shows 2–3 suggestions fetched from `GET /api/v1/guest/{token}/upsell?item_ids[]=...` (lazy loaded when drawer opens)
- "Place Order" button — full width, accent colour
- Note field: "Any requests for the kitchen?" (optional)

**Place Order flow**:
1. POST to `/api/v1/guest/{token}/orders`
2. Show loading spinner on button
3. On success: clear cart, show toast "Order sent to kitchen! 🎉", switch to Orders tab
4. On error: show toast with error message, keep cart intact

---

### Screen 3 — Orders Page

**Route**: `/orders`

**What it shows**:
- List of all orders placed this session (most recent first)
- Each order shows: order number, status badge, total, item count
- Tapping an order expands it to show the OrderTracker

**OrderTracker** (inline expand):
```
  ● Order Received
  ● Sent to Kitchen       ✓ (filled circle = completed)
  ○ Being Prepared        ← current step (pulsing)
  ○ Ready to Serve
  ○ Served
```
- Status is polled every 15 seconds via `GET /api/v1/guest/{token}/orders/{orderId}`
- When status changes, animate the progress step filling in
- Per-item statuses are shown below the tracker (e.g. "Chicken Biryani — Preparing", "Fresh Juice — Ready")
- If order is "ready", show a toast notification: "Your order is ready! 🍽️"

**Empty state**: "No orders yet. Browse our menu and place your first order!"

---

### Screen 4 — Pay Page

**Route**: `/pay`

**What it shows**:
- Bill summary: all orders this session, subtotal per order, grand total
- Outstanding balance (unpaid amount)
- "Pay with M-Pesa" section:
  - Phone number input (pre-filled with last used number from localStorage)
  - Amount field (pre-filled with outstanding balance, editable for partial payment)
  - "Send Payment Request" button

**M-Pesa flow**:
1. POST to `/api/v1/guest/{token}/payments/mpesa`
2. Show PaymentPolling screen: animated M-Pesa logo + "Check your phone — enter your M-Pesa PIN to complete payment"
3. Poll `GET /api/v1/guest/{token}/payments/{paymentId}/status` every 3 seconds
4. On `status: completed`: confetti animation + "Payment confirmed! Thank you 🎉" + receipt details
5. On `status: failed`: show error + "Try again" button
6. Timeout after 2 minutes: show "Payment request expired. Please try again."

**Cash option**: simple message card — "Prefer to pay cash? Call your waiter or pay at the cashier. Quote your table number: **T2**"

---

## API INTEGRATION

Base URL: stored in `.env` as `VITE_API_BASE_URL=http://localhost:8000`

The token from the URL (`/table/:token`) is used in every API call. Store it in Zustand `sessionStore` on app init.

```js
// src/api/guest.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api/v1/guest',
});

export const resolveSession  = (token)          => api.get(`/${token}`);
export const getMenu         = (token)          => api.get(`/${token}/menu`);
export const searchMenu      = (token, q)       => api.get(`/${token}/menu/search`, { params: { q } });
export const getPopular      = (token)          => api.get(`/${token}/popular`);
export const getUpsell       = (token, itemIds) => api.get(`/${token}/upsell`, { params: { item_ids: itemIds } });
export const placeOrder      = (token, body)    => api.post(`/${token}/orders`, body);
export const trackOrder      = (token, orderId) => api.get(`/${token}/orders/${orderId}`);
export const initiateMpesa   = (token, body)    => api.post(`/${token}/payments/mpesa`, body);
export const pollPayment     = (token, payId)   => api.get(`/${token}/payments/${payId}/status`);
```

**Error handling**: all API errors must be caught and shown as toast messages. Never show raw error objects to the user. Map common HTTP status codes:
- 404 → "Not found. Please try again."
- 410 → "This session has expired. Please ask your waiter."
- 422 → Show the first validation error message from `errors` object
- 500/502 → "Something went wrong on our end. Please try again in a moment."

---

## CART STORE (Zustand)

```js
// src/stores/cartStore.js
{
  items: [],           // [{ menuItem, variantId, modifierIds, quantity, notes, unitPrice }]
  addItem(menuItem, variantId, modifierIds, quantity, notes),
  removeItem(index),
  updateQuantity(index, quantity),
  clearCart(),
  get totalItems(),    // sum of quantities
  get subtotal(),      // sum of line totals
  get tax(),           // subtotal * 0.16
  get total(),         // subtotal + tax
}
```

---

## SESSION STORE (Zustand)

```js
// src/stores/sessionStore.js
{
  token: null,
  session: null,       // { id, covers, guest_name, opened_at }
  table: null,         // { id, label, floor }
  hotel: null,         // { name, logo_url, primary_color, currency, mpesa_paybill }
  setSession(data),    // called after resolveSession API response
  isReady: false,      // true once session is loaded
}
```

---

## THEME / DYNAMIC BRANDING

On session load, apply the hotel's `primary_color` as a CSS variable:

```js
document.documentElement.style.setProperty('--color-primary', hotel.primary_color);
```

Use `var(--color-primary)` for:
- Header background
- Active category tab underline
- [+] add buttons
- "Place Order" and "Pay" CTAs
- OrderTracker filled steps

---

## PERFORMANCE REQUIREMENTS

- Menu data cached with React Query or SWR (staleTime: 5 minutes) — no flicker on revisit
- Images lazy loaded with `loading="lazy"` and a blurred placeholder while loading
- Skeleton loaders for every list while data is fetching — never show blank space
- App shell cached by service worker so the UI loads instantly on revisit even with slow network
- Bundle size: keep under 500kb gzipped. Do not add heavy libraries.

---

## ACCESSIBILITY

- All interactive elements have `aria-label`
- Colour contrast meets WCAG AA (4.5:1 minimum)
- Touch targets minimum 44×44px
- Cart drawer and bottom sheets trap focus and are closable with Escape key

---

## WHAT NOT TO BUILD

- No login / registration
- No staff features
- No admin panel
- No reservation booking (separate project)
- No table map / floor plan
- No push notifications (polling is sufficient)
- No multi-language support

---

## TEST DATA

Use these values to test the app locally:

```
Backend: http://localhost:8000

QR Token (Table T1): mamba-table-1-token-0000000000001
Test URL: http://localhost:5173/table/mamba-table-1-token-0000000000001

QR Token (Table T2): mamba-table-2-token-0000000000002
Test URL: http://localhost:5173/table/mamba-table-2-token-0000000000002
```

The Mamba Hotel seeder has already been run on the backend. These tokens are live and will return real menu data.

---

## DELIVERABLES

1. Complete working app matching the reference video design
2. `README.md` with setup instructions and env variables
3. `.env.example` with `VITE_API_BASE_URL`
4. `public/manifest.json` configured for PWA install
5. All components documented with brief JSDoc comments

---

## FINAL INSTRUCTION

**Build the complete app end-to-end. Do not leave placeholder components, TODO comments, or stub functions.** Every screen must be functional with real API calls. The app must work on a real phone browser when the QR code is scanned. Start with the project setup, then build screen by screen in the order listed above.

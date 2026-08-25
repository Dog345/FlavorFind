# Mamba Manager — Hotel/Restaurant Manager Dashboard

React 18 + Vite manager dashboard for Mamba Hotel, built from the frontend build prompt.

## Status: Stage 1 of 2

**Built and working:**
- Auth (Sanctum bearer token), route guards, role-based nav
- App shell: sidebar, topbar, mobile bottom tab bar, WebSocket (Reverb/Echo) wiring
- Dashboard — KPIs, revenue chart, status funnel, payment breakdown, recent orders
- Orders — filterable list, detail drawer, new order flow (session → menu → cart), status updates, cancel, payment
- Kitchen Display (KDS) — full-screen dark view, live age timers, item + order status controls, 30s fallback poll
- Tables — floor tabs, table grid, open/close session, live status

**Coming in stage 2:** Reservations, Menu Management, Payments (list + reconciliation), Analytics, Settings (Staff, Floors & Tables, Tenant, Upsell Rules).

## Setup

```bash
npm install
cp .env.example .env   # then fill in your real API/Reverb values
npm run dev
```

## Notes

- Every screen calls the real API endpoints from the spec first. If the backend isn't reachable yet, the screen falls back to clearly-labeled sample data so the UI is inspectable — remove `src/lib/demoData.js` usage once your API is live if you'd rather see empty/error states instead.
- `VITE_API_URL` defaults to the URL given in the original prompt (`https://api.hotel.flavorfind.co.ke`) — update `.env` if that's not right.
- Colors/typography were sampled from the provided design video (coral `#f0563e` brand color, warm neutral surface, soft pink icon circles).

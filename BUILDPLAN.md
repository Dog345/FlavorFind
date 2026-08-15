# FlavorFind Enterprise — Day 1 Build Plan
**Date:** August 14, 2026  
**Goal:** Ship a fully working Laravel 11 backend with PostgreSQL schema, multi-tenant isolation, M-Pesa integration, and a seeded database — ready to plug a frontend into.

---

## Environment Snapshot

| Tool | Status |
|------|--------|
| PHP | 8.5.4 ✅ |
| Composer | 2.10.2 ✅ |
| Redis | 8.0.5 ✅ |
| Node.js | 22.22.1 ✅ |
| PostgreSQL | Supabase (hosted) — no local install needed ✅ |
| PHP pdo_pgsql extension | ⚠️ Needs install |

---

## What We Are Building Today

A production-grade **Laravel 11 REST API** that is the single brain behind every FlavorFind hotel client.
It handles authentication, multi-tenant data isolation, menus, orders, M-Pesa payments, and real-time kitchen events.

---

## The 10 Steps — In Order

### Step 1 — Install PHP pdo_pgsql Extension
> **Why:** PHP currently has `pdo_sqlite` but not `pdo_pgsql`. Laravel cannot talk to PostgreSQL (or Supabase) without it.

- Install `php-pgsql` and `php8.5-pgsql` system packages
- Verify `pdo_pgsql` appears in `php -m`
- This is the only system-level install needed — no local PostgreSQL server required

---

### Step 2 — Scaffold Laravel 11 Project
> **Why:** Clean foundation. We install only what the MVP needs — no bloat.

Packages to install:
- `laravel/sanctum` — API token authentication
- `predis/predis` — Redis client for queues and caching
- `laravel/reverb` — WebSocket server for real-time kitchen display
- `pgvector/pgvector` — PHP client for pgvector similarity queries

Project lives at: `FlavorFind/backend/`

---

### Step 3 — Create Supabase Project + Configure Environment
> **Why:** Supabase gives us PostgreSQL 16 + pgvector pre-installed, hosted, with a connection string ready to paste. No server setup.

Steps:
- Create project at supabase.com → `flavorfind-enterprise`
- Copy the connection string (Transaction pooler — port 6543 for Laravel)
- Enable the `vector` extension in Supabase Dashboard → Database → Extensions
- Configure Laravel `.env`:
  - `DB_CONNECTION=pgsql`
  - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` from Supabase
  - `QUEUE_CONNECTION=redis`
  - `BROADCAST_CONNECTION=reverb`
  - M-Pesa keys stubbed for now

---

### Step 4 — Write All MVP Migrations
> **Why:** Schema is the contract. Get it right before writing a single model or controller.

Tables to create:

| Table | Scope | Purpose |
|-------|-------|---------|
| `tenants` | Global | One row per hotel — slug, domain, branding, M-Pesa paybill |
| `master_ingredients` | Global | Shared ingredient library with allergen flags + pgvector column |
| `menu_items` | Per-tenant | Each hotel's menu, linked to `tenant_id` |
| `upsell_rules` | Per-tenant | Trigger item → suggested item pairing rules |
| `orders` | Per-tenant | Full order with M-Pesa status and kitchen status |

All tenant-scoped tables carry `tenant_id UUID NOT NULL` as a foreign key to `tenants`.

---

### Step 5 — Enable Row-Level Security (RLS) Policies
> **Why:** This is the zero-data-leak guarantee. Hotel A can never see Hotel B's data — enforced at the database level, not just the app level.

- Enable RLS on `menu_items`, `upsell_rules`, `orders`
- Write RLS policy: `USING (tenant_id = current_setting('app.current_tenant_id')::UUID)`
- This runs as a raw SQL migration via `DB::statement()`
- pgvector is already enabled on Supabase — just need to confirm the extension is active

---

### Step 6 — Tenant Middleware
> **Why:** Every single API request must know which hotel it belongs to before touching the database.

The middleware does 3 things on every request:
1. Extract `tenant_id` from the JWT/Sanctum token or `X-Tenant-ID` header
2. Load the tenant from the `tenants` table and bind it to the request
3. Set `SET LOCAL app.current_tenant_id = '...'` on the PostgreSQL session so RLS activates

If no valid tenant is found → `401 Unauthorized` immediately.

---

### Step 7 — Core API Routes + Controllers
> **Why:** This is what the frontend and mobile app will actually call.

Endpoints to build:

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register a new tenant + admin user |
| POST | `/api/auth/login` | Login, returns Sanctum token |
| GET | `/api/menu` | Get all available menu items for current tenant |
| POST | `/api/menu` | Create a menu item (manager only) |
| PUT | `/api/menu/{id}` | Update a menu item |
| DELETE | `/api/menu/{id}` | Delete a menu item |
| GET | `/api/upsell/{item_id}` | Get upsell suggestions for a menu item |
| POST | `/api/orders` | Place a new order (guest) |
| GET | `/api/orders` | List orders for current tenant (manager/KDS) |
| PATCH | `/api/orders/{id}/status` | Update order status (KDS: prep → ready → completed) |
| POST | `/api/payments/initiate` | Trigger M-Pesa STK Push |
| POST | `/api/payments/webhook` | Safaricom callback — update order payment status |

---

### Step 8 — M-Pesa Daraja Service
> **Why:** This is the money. Without working payments, hotels won't pay for the product.

The `DarajaService` class handles:
1. **Access token** — OAuth2 call to Safaricom, cached in Redis for 55 minutes
2. **STK Push** — sends payment prompt to guest's phone
3. **Webhook handler** — receives Safaricom callback, dispatches `ProcessMpesaWebhookJob` to Redis queue
4. **Queue job** — updates `orders.mpesa_status` and `orders.mpesa_receipt`, broadcasts to KDS via WebSocket

Credentials loaded from `.env`. Sandbox mode by default.

---

### Step 9 — Download, Clean, and Seed Master Ingredients
> **Why:** An empty database is useless for testing. We need real data to validate everything works end-to-end.

**Three-phase approach:**

**Phase A — Download**
Sources to pull from (all free, open-licensed):
- **Open Food Facts** (openfoodfacts.org) — 3M+ food products with ingredient lists, allergen data, categories. Available as a free CSV/JSON dump.
- **USDA FoodData Central** (fdc.nal.usda.gov) — ~600k food items, nutrient data, standardised ingredient names. Free API + bulk download.
- **Frinkiac / Ingredient datasets on HuggingFace** — curated ingredient lists with flavor profiles

Target: **500,000+ raw ingredient records** before cleaning.

**Phase B — Clean**
A PHP/Python script that:
- Deduplicates ingredient names (case-insensitive, trim whitespace)
- Normalises names (e.g. "tomatoes, diced" → "tomato")
- Maps allergen flags (`gluten`, `dairy`, `nuts`, `eggs`, `shellfish`, `soy`)
- Strips non-food items, chemicals, additives we don't want
- Assigns category (`vegetable`, `protein`, `dairy`, `grain`, `spice`, `beverage`, etc.)
- Outputs a clean CSV ready to bulk-insert

**Phase C — Seed**
- Laravel seeder reads the clean CSV
- Inserts in batches of 1,000 rows (memory-safe for 500k records)
- `flavor_vector` left as `NULL` for MVP — populated later when AI embeddings are added
- Estimated insert time at 1k batches: ~8–15 minutes for 500k rows on Supabase

---

### Step 10 — Demo Tenant Seeder + Verification Pass
> **Why:** Confirm the full stack works end-to-end before calling it done.

**Demo Tenants:**
- `Westlands Grill` and `Sankara Bistro`
- Each gets 10–15 menu items (starters, mains, drinks, desserts)
- Each gets 5 upsell rules
- 1 admin user per tenant with a known test password

**Verification Checklist:**
- [ ] `php artisan migrate` runs clean — all tables created on Supabase
- [ ] RLS policies are active (confirm in Supabase Dashboard → Auth → Policies)
- [ ] Tenant middleware blocks requests with no token → `401`
- [ ] `GET /api/menu` with Hotel A token returns only Hotel A's items
- [ ] `GET /api/menu` with Hotel B token returns only Hotel B's items
- [ ] `POST /api/orders` creates order scoped to correct tenant
- [ ] M-Pesa STK Push fires correctly in sandbox
- [ ] Master ingredients seeded and queryable
- [ ] Redis queue worker processes jobs

---

## File Structure (What We'll Have at End of Day)

```
FlavorFind/
├── backend/                          ← Laravel 11 project
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── MenuController.php
│   │   │   │   ├── OrderController.php
│   │   │   │   ├── UpsellController.php
│   │   │   │   └── PaymentController.php
│   │   │   └── Middleware/
│   │   │       └── ResolveTenant.php
│   │   ├── Models/
│   │   │   ├── Tenant.php
│   │   │   ├── MenuItem.php
│   │   │   ├── Order.php
│   │   │   ├── UpsellRule.php
│   │   │   └── MasterIngredient.php
│   │   ├── Services/
│   │   │   └── DarajaService.php
│   │   └── Jobs/
│   │       └── ProcessMpesaWebhookJob.php
│   ├── database/
│   │   ├── migrations/               ← All schema migrations
│   │   └── seeders/
│   │       ├── MasterIngredientSeeder.php
│   │       └── DemoTenantSeeder.php
│   ├── routes/
│   │   └── api.php
│   └── .env
├── data/                             ← Raw + cleaned ingredient data lives here
│   ├── raw/                          ← Downloaded dumps (gitignored — too large)
│   └── clean/
│       └── ingredients_clean.csv     ← Final seeding file
├── scripts/
│   └── clean_ingredients.php         ← Data cleaning script
├── BUILDPLAN.md                      ← This file
├── deepseek_html_*.html              ← Original blueprint docs
└── recipes_import.csv                ← Old data (not used for seeding)
```

---

## Data Sources We Will Download

| Source | Records | Format | License | What We Take |
|--------|---------|--------|---------|--------------|
| Open Food Facts | 3M+ products | CSV dump (~9GB) / API | Open Database License | Ingredient names, allergen flags, categories |
| USDA FoodData Central | ~600k items | JSON / CSV bulk download | Public Domain | Standardised ingredient names, food categories |
| HuggingFace ingredient datasets | ~100k | CSV/JSON | Various open | Curated ingredient-flavor profiles |

After deduplication and cleaning across all sources → **target: 200k–500k clean, unique ingredients**.

---

## What We Are NOT Doing Today

| Deferred | Reason |
|----------|--------|
| Next.js frontend | Backend must be solid first |
| Kotlin Android app | API must exist before any client |
| AI flavor vector embeddings | Needs embedding model — post-MVP |
| Production deployment | Supabase IS production-ready, but we verify locally first |
| Kitchen Display WebSocket UI | Reverb is installed, UI is frontend work |
| Multi-currency / i18n | KES only for MVP |

---

## Definition of Done for Today

> ✅ A developer (or a Kotlin app, or a Next.js page) can hit `POST /api/auth/login`, get a token, and use that token to call `GET /api/menu` and receive the correct hotel's menu — with PostgreSQL RLS on Supabase silently guaranteeing cross-tenant data never leaks — place an order that triggers an M-Pesa STK Push, and query a database seeded with hundreds of thousands of real ingredients.

---

*FlavorFind Enterprise · Day 1 Build Plan · August 14, 2026*

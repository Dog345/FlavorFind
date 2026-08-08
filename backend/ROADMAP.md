# FlavorFind Backend — Roadmap & Milestones

---

## Phase 1 — Project Scaffolding
> Set up the Laravel project and wire all existing backend files.

**Tasks:**
- [ ] Run `composer create-project laravel/laravel backend`
- [ ] Copy all pre-built files into the Laravel project:
  - `app/Services/SpoonacularRouter.php`
  - `app/Services/SpoonacularService.php`
  - `app/Models/ApiKeyUsage.php`
  - `app/Http/Controllers/RecipeController.php`
  - `app/Http/Controllers/CategoryController.php`
  - `app/Http/Controllers/HealthController.php`
  - `config/spoonacular.php`
  - `routes/api.php`
  - `database/migrations/xxxx_create_api_key_usages_table.php`
- [ ] Copy `.env` (already configured with 7 API keys)
- [ ] Run `php artisan key:generate`
- [ ] Run `php artisan migrate`
- [ ] Run `php artisan serve` and hit `/api/health` to confirm it works

### ✅ Milestone 1 — Backend boots, `/api/health` returns key stats, DB migrated

---

## Phase 2 — Smart Key Router Verification
> Confirm the key rotation logic works end-to-end.

**Tasks:**
- [ ] Hit `/api/recipes?ingredients=chicken` and confirm a key is used
- [ ] Check `/api/stats` to see request count increment
- [ ] Manually set one key's `request_count` to 150 in DB and confirm router skips to next key
- [ ] Confirm 402 from Spoonacular triggers auto-retry with next key
- [ ] Confirm all-keys-exhausted returns HTTP 429 to client

### ✅ Milestone 2 — Smart router rotates keys correctly, 429 on full exhaustion

---

## Phase 3 — Core Endpoints
> All recipe endpoints working and returning correct data.

**Tasks:**
- [ ] `GET /api/recipes?ingredients=chicken,rice` — search by ingredients
- [ ] `GET /api/recipes/{id}` — recipe detail
- [ ] `GET /api/recipes/search?query=pasta&cuisine=italian&diet=vegetarian` — complex search
- [ ] `GET /api/recipes/random?number=10&tags=vegetarian` — random recipes
- [ ] `GET /api/ingredients/autocomplete?query=chick` — ingredient autocomplete
- [ ] `GET /api/categories` — list all cuisines, diets, meal types
- [ ] `GET /api/categories/cuisine/{cuisine}` — recipes by cuisine
- [ ] `GET /api/categories/diet/{diet}` — recipes by diet
- [ ] `GET /api/categories/type/{type}` — recipes by meal type

### ✅ Milestone 3 — All 9 endpoints return correct Spoonacular data

---

## Phase 4 — Caching Layer
> Reduce API key consumption with response caching.

**Tasks:**
- [ ] Confirm file-based cache works locally (`CACHE_DRIVER=file`)
- [ ] Switch to `CACHE_DRIVER=redis` for production
- [ ] Verify cache TTLs:
  - Ingredient search → 6 hours
  - Recipe detail → 12 hours
  - Complex search → 6 hours
  - Random recipes → 30 minutes
  - Autocomplete → 24 hours
- [ ] Add `php artisan cache:clear` to deployment script

### ✅ Milestone 4 — Caching active, repeated requests don't consume API quota

---

## Phase 5 — Error Handling & Response Consistency
> Clean, predictable error responses for Flutter and Next.js clients.

**Tasks:**
- [ ] Add global exception handler in `app/Exceptions/Handler.php`:
  - `RuntimeException` (all keys exhausted) → 429 JSON
  - `ValidationException` → 422 JSON
  - Spoonacular HTTP errors → 502 JSON
- [ ] Add `X-Key-Used` and `X-Requests-Remaining` response headers (for debugging)
- [ ] Standardize all responses to `{ data, message, status }` shape

### ✅ Milestone 5 — Consistent JSON errors, debug headers on all responses

---

## Phase 6 — CORS & Security
> Allow Flutter (mobile) and Next.js (web) to call the API safely.

**Tasks:**
- [ ] Configure `config/cors.php` to allow Flutter and Next.js origins
- [ ] Add rate limiting middleware to public endpoints (`throttle:60,1`)
- [ ] Sanitize all query inputs (already handled via `$request->validate()`)
- [ ] Ensure `.env` is in `.gitignore` (API keys never committed)

### ✅ Milestone 6 — CORS configured, rate limiting active, keys secured

---

## Phase 7 — Deployment
> Deploy to a production server.

**Tasks:**
- [ ] Choose hosting: **Railway / Render / DigitalOcean / AWS EC2**
- [ ] Set up MySQL database on host
- [ ] Set all `.env` values in host environment (especially API keys)
- [ ] Switch `CACHE_DRIVER=redis` and provision Redis instance
- [ ] Run `php artisan migrate --force` on production
- [ ] Set `APP_ENV=production` and `APP_DEBUG=false`
- [ ] Point Flutter app and Next.js frontend to production URL

### ✅ Milestone 7 — Backend live on production URL, Flutter + Next.js connected

---

## Phase 8 — Monitoring & Maintenance
> Keep the backend healthy long-term.

**Tasks:**
- [ ] Set up a daily cron to log key usage stats (`/api/stats`)
- [ ] Add alert when remaining daily capacity drops below 20%
- [ ] Add remaining 8 Spoonacular keys to `.env` when available (slots 8–15 ready)
- [ ] Monitor Spoonacular API for breaking changes

### ✅ Milestone 8 — Usage monitored, alerts set, ready to scale to 15 keys

---

## Summary

| Phase | Focus | Milestone |
|-------|-------|-----------|
| 1 | Scaffolding | Backend boots |
| 2 | Key Router | Rotation & fallback verified |
| 3 | Endpoints | All 9 routes working |
| 4 | Caching | Quota preserved |
| 5 | Error Handling | Consistent responses |
| 6 | CORS & Security | Safe for clients |
| 7 | Deployment | Live on production |
| 8 | Monitoring | Long-term health |

**Total capacity at full 15 keys: 2,250 requests/day**
**Current capacity (7 keys): 1,050 requests/day**

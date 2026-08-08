# FlavorFind — Laravel Backend

## Setup

```bash
composer create-project laravel/laravel backend
cd backend

# Copy all files from this repo into the Laravel project
# Then run:

cp .env.example .env
php artisan key:generate

# Configure your DB in .env, then:
php artisan migrate

# Add your Spoonacular keys to .env
# SPOONACULAR_KEY_1=xxx ... SPOONACULAR_KEY_15=xxx

php artisan serve
```

---

## Smart API Key Router

The `SpoonacularRouter` manages up to **15 Spoonacular API keys** automatically:

- Keys are tried **in order** (key 1 → key 2 → ... → key 15)
- When a key hits its daily limit (`SPOONACULAR_DAILY_LIMIT`, default 150), it's marked exhausted and the next key is used
- If Spoonacular returns a **402** mid-request, the key is immediately marked exhausted and the request is retried with the next key — **transparently, no error to the client**
- Usage is tracked per key per day in the `api_key_usages` table
- At midnight, all keys reset automatically (new date = new records)
- With 15 keys × 150 req/day = **2,250 requests/day** total

---

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + key usage summary |
| GET | `/api/stats` | Detailed per-key usage breakdown |
| GET | `/api/recipes?ingredients=chicken,rice` | Search by ingredients |
| GET | `/api/recipes/search?query=pasta&cuisine=italian&diet=vegetarian` | Complex search |
| GET | `/api/recipes/random?number=10&tags=vegetarian` | Random recipes |
| GET | `/api/recipes/{id}` | Recipe detail by ID |
| GET | `/api/ingredients/autocomplete?query=chick` | Ingredient autocomplete |
| GET | `/api/categories` | All cuisines, diets, meal types |
| GET | `/api/categories/cuisine/{cuisine}` | Recipes by cuisine |
| GET | `/api/categories/diet/{diet}` | Recipes by diet |
| GET | `/api/categories/type/{type}` | Recipes by meal type |

---

## Caching

Responses are cached to minimize API key usage:
- Ingredient search: **6 hours**
- Recipe detail: **12 hours**
- Complex search: **6 hours**
- Random recipes: **30 minutes** (refreshes hourly)
- Ingredient autocomplete: **24 hours**

Change `CACHE_DRIVER=redis` in `.env` for production.

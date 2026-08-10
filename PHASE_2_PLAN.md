# FlavorFind Phase 2: Database & Data Seeding Plan

## Objective
Replace hardcoded data (15 home sections + ingredient categories) with database-driven content, while keeping live Spoonacular API search.

---

## Phase 2 Timeline & Tasks

### STAGE 1: Database Design & Setup (Laravel Backend)

**1.1 Create Database Tables**
```
tables needed:
- sections (id, name, icon, type, position, slug)
- section_recipes (id, section_id, recipe_id, position)
- recipes (id, title, image_url, ready_minutes, cuisines, diets, servings, rating, description)
- ingredients (id, name, emoji, category)
- ingredient_categories (id, name, icon, color, gradient1, gradient2)
```

**1.2 Create Migrations**
- Each table with proper indexes (slug, category_id, name for fast queries)
- Foreign key constraints
- Timestamps

**1.3 Create Eloquent Models**
- Section, SectionRecipe, Recipe, Ingredient, IngredientCategory

**1.4 Create API Endpoints**
- GET /api/sections - all 15 home sections with recipes
- GET /api/sections/{slug} - specific section with recipes
- GET /api/ingredients/categories - all ingredient categories
- GET /api/ingredients/categories/{id} - category with ingredients

---

### STAGE 2: Data Sources (No Manual Entry!)

#### **Option A: Spoonacular Bulk API** ⭐ BEST
- **URL**: https://spoonacular.com/food-api
- **What you get**: 1M+ recipes with full metadata
- **Cost**: $0 (free tier has limits, but enough for seeding)
- **How**: Use their search endpoints to pull recipes into your DB
- **Example**: 
  ```
  GET https://api.spoonacular.com/recipes/findByIngredients?ingredients=chicken,rice&number=10&apiKey=YOUR_KEY
  ```

#### **Option B: Open Recipe Databases**

1. **Edamam Recipe API** (Free tier)
   - URL: https://developer.edamam.com/
   - 1M+ recipes available
   - Includes nutrition, cuisines, diet labels
   - Rate limited but free

2. **TheMealDB** (Completely Free!)
   - URL: https://www.themealdb.com/api.php
   - 300+ curated recipes
   - Free, no API key needed
   - Perfect for seeding initial data
   - Includes: Name, Image, Ingredients, Instructions, Cuisine, Category

3. **Tasty API** (Free)
   - URL: https://rapidapi.com/apidojo/api/tasty
   - Thousands of recipes
   - Free tier available
   - High quality data

4. **Recipe Search API** (Open API)
   - URL: https://rapidapi.com/heisenbug/api/recipe-search
   - Free tier: 100 requests/month
   - Good for starting data

#### **Option C: Kaggle Datasets** (One-time download)
- **Recipes Dataset**: https://www.kaggle.com/datasets/huaqilwang/food-recipes
- **Recipes with Ratings**: https://www.kaggle.com/datasets/shuyangli94/food-ratings
- Download as CSV/JSON, parse and seed DB
- No rate limits, complete control

#### **Option D: GitHub Recipe Collections** (Free!)
- **RecipeFilter**: https://github.com/KevinLiao159/RecipeRecommendationEngine (15K recipes)
- **Recipe Database**: https://github.com/Samrat-14/Recipe-Database (5K recipes)
- Clone repo, extract JSON/CSV, seed directly

---

### STAGE 3: Data Seeding Strategy

**3.1 Choose Primary Source**
Recommendation: **TheMealDB** (free, no auth needed) + **Spoonacular** for enrichment

**3.2 Create Seeding Scripts**

**Step 1: Seed Recipes from TheMealDB**
```bash
# Create artisan command
php artisan make:command SeedRecipesFromMealDB
```
- Fetch all meals from TheMealDB API
- Parse JSON: title, image, ingredients, instructions, category, cuisine
- Store in `recipes` table
- Result: ~300 quality recipes instantly

**Step 2: Enrich with Spoonacular**
```bash
# Create artisan command  
php artisan make:command EnrichRecipesWithSpoonacular
```
- For each recipe, search Spoonacular for enrichment
- Add: readyInMinutes, servings, nutrition, diets
- Cache results (don't hammer API)

**Step 3: Seed Ingredient Categories**
```bash
# Create artisan command
php artisan make:command SeedIngredients
```
- Use hardcoded `ingredients_data.dart` data
- Map 17 categories + 100+ ingredients
- Add emoji, color, gradient

**Step 4: Create 15 Home Sections**
```bash
# Create artisan command
php artisan make:command SeedHomeSections
```
- Create 15 sections from hardcoded `home_data.dart`
- Assign recipes to sections based on ingredients/cuisine
- Example:
  - "🔥 Trending Now" → Top 5 most-searched recipes
  - "🥗 Healthy Heroes" → Recipes under 500 cal
  - "🌍 World Cuisines" → Grouped by cuisine

---

### STAGE 4: API Endpoints Implementation

**4.1 GET /api/sections**
```json
{
  "sections": [
    {
      "id": 1,
      "name": "🔥 Trending Now",
      "icon": "🔥",
      "type": "trending",
      "position": 1,
      "recipes": [
        {
          "id": 101,
          "title": "Honey Glazed Salmon",
          "image": "...",
          "readyInMinutes": 20,
          "rating": 4.8
        }
      ]
    }
  ]
}
```

**4.2 GET /api/ingredients/categories**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "🥬 Leafy Greens",
      "icon": "🥬",
      "gradient": ["#4ade80", "#22c55e"],
      "ingredients": [
        {
          "id": 1,
          "name": "Spinach",
          "emoji": "🥬",
          "color": "#4ade80"
        }
      ]
    }
  ]
}
```

---

### STAGE 5: Frontend Updates (Next.js + Flutter)

**5.1 Next.js Homepage**
- Remove static `CUISINE_IMAGES` import
- Fetch `/api/sections` on server
- Map sections to grid
- Add loading states, error handling

**5.2 Flutter HomeScreen**
- Replace static `kTrendingNow`, `kQuickBites`, etc.
- Create `HomeProvider` (Riverpod) that fetches `/api/sections`
- Update UI to pull from provider

**5.3 Flutter RecipesScreen**
- Replace static `kIngredientCategories`
- Create `IngredientsProvider` that fetches `/api/ingredients/categories`
- Keep existing ingredient picker logic

---

## Implementation Order

1. **Database Design** (30 min)
   - Create migrations
   - Create models

2. **Seeding Scripts** (1 hour)
   - TheMealDB seeder
   - Spoonacular enricher
   - Ingredients seeder
   - Sections seeder

3. **API Endpoints** (1 hour)
   - GET /api/sections
   - GET /api/sections/{id}
   - GET /api/ingredients/categories
   - Add pagination, caching

4. **Frontend Updates** (1.5 hours)
   - Next.js integration
   - Flutter Riverpod providers
   - Error handling, loading states

5. **Testing & Optimization** (1 hour)
   - Test all endpoints
   - Add DB indexes
   - Performance check

---

## Data Sources Recommendation

**Primary**: TheMealDB (free, immediate, 300 recipes)
**Secondary**: Spoonacular (enrichment, ratings)
**Fallback**: Kaggle datasets (bulk data if needed)

**Total time**: ~4-5 hours for full Phase 2

---

## Questions Before Starting?

1. Do you want to use TheMealDB as primary source? (I recommend yes)
2. Should we keep all 15 home sections or simplify? (Keep all for now)
3. Do you want indexed full-text search on recipes? (Yes - add later)
4. Should sections be editable in admin panel? (Later phase)

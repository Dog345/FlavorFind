# FlavorFind — Flutter App Roadmap

Porting the full React Native / Expo app to Flutter.
Backend: Laravel API at `http://localhost:8000/api` (local) → production URL when deployed.

---

## Phase 1 — Project Setup & Structure

**Tasks:**
- [ ] `flutter create flutter_app` inside `flutter-app/`
- [ ] Set min SDK, package name (`com.flavorfind.app`)
- [ ] Add dependencies to `pubspec.yaml`:
  - `dio` — HTTP client
  - `go_router` — navigation
  - `flutter_riverpod` — state management
  - `cached_network_image` — image caching
  - `shared_preferences` — local storage (settings)
  - `google_fonts` — Poppins font
  - `shimmer` — skeleton loaders
  - `flutter_dotenv` — env config
- [ ] Set up folder structure:
  ```
  lib/
    core/        # theme, constants, api client
    models/      # Recipe, Category, etc.
    services/    # api.dart
    providers/   # riverpod providers
    screens/     # home, recipes, categories, detail, settings
    widgets/     # shared components
  ```
- [ ] Configure dark theme (`#121212` bg, `#e87a3d` primary, white text)
- [ ] Set up `AppRouter` with bottom nav (Home, Recipes, Categories, Settings)

### ✅ Milestone 1 — App runs, dark theme applied, bottom nav navigates between 4 empty screens

---

## Phase 2 — API Service Layer

**Tasks:**
- [ ] Create `ApiService` using `dio` with base URL from `.env`
- [ ] Implement all endpoints matching the backend:
  - `GET /api/health`
  - `GET /api/recipes?ingredients=`
  - `GET /api/recipes/search?query=&cuisine=&diet=`
  - `GET /api/recipes/random?number=&tags=`
  - `GET /api/recipes/{id}`
  - `GET /api/ingredients/autocomplete?query=`
  - `GET /api/categories`
  - `GET /api/categories/cuisine/{cuisine}`
  - `GET /api/categories/diet/{diet}`
  - `GET /api/categories/type/{type}`
- [ ] Create `Recipe`, `SearchResult`, `Category`, `HealthStatus` models with `fromJson`
- [ ] Add Riverpod providers for each endpoint
- [ ] Handle errors: 429 (keys exhausted), 502 (Spoonacular down), network errors

### ✅ Milestone 2 — All API calls work, models parse correctly, errors handled gracefully

---

## Phase 3 — Home Screen

Mirror of the RN `HomeScreen.js`.

**Tasks:**
- [ ] Animated header with time-based greeting (☀️ morning / ⏰ afternoon / 🌙 evening / 🦉 late night)
- [ ] Random rotating cooking quote subtitle
- [ ] Ingredient search bar with autocomplete dropdown
- [ ] "Trending Now" horizontal scroll — hardcoded featured recipes (same 5 as RN)
- [ ] "What's in your fridge?" quick-pick ingredient chips (Chicken, Tomato, Cheese, etc.)
- [ ] Search results `FlatList` with `RecipeCard` widgets
- [ ] `DancingChefLoader` — animated loading state (Lottie or custom Flutter animation)
- [ ] Pull-to-refresh
- [ ] Daily API usage indicator (from `/api/health`)

### ✅ Milestone 3 — Home screen fully functional: search works, trending shows, loader animates

---

## Phase 4 — Recipes Screen (Ingredient Picker)

Mirror of the RN `RecipesScreen.js`.

**Tasks:**
- [ ] Categorized ingredient browser (Leafy Greens, Proteins, Dairy, etc.)
- [ ] Tap to select/deselect ingredients — selected shown as chips at top
- [ ] "Search Recipes" button triggers API call with selected ingredients
- [ ] Filter modal (cuisine, diet, meal type, max time)
- [ ] Results grid with `RecipeCard`
- [ ] `BlurView`-style modal overlay for filters
- [ ] Animated entrance for ingredient categories
- [ ] Empty state when no ingredients selected

### ✅ Milestone 4 — Ingredient picker works, filters apply, results load correctly

---

## Phase 5 — Categories Screen

Mirror of the RN `CategoriesScreen.js`.

**Tasks:**
- [ ] Three tabs: Cuisines | Diets | Meal Types
- [ ] Grid of category cards with gradient backgrounds and emoji icons
- [ ] Tap category → fetch recipes from `/api/categories/cuisine/{c}` etc.
- [ ] Results shown in bottom sheet or new screen
- [ ] "Coming Soon" modal for unimplemented categories (animated chef hat + bounce)
- [ ] Animated card entrance on scroll

### ✅ Milestone 5 — All 3 category tabs work, tapping loads recipes, coming-soon modal shows

---

## Phase 6 — Recipe Detail Screen

Mirror of the RN `RecipeDetailScreen.js`.

**Tasks:**
- [ ] Hero image with parallax scroll effect
- [ ] Animated header that fades out on scroll
- [ ] Recipe title, rating, cook time, difficulty badge
- [ ] Tabs: Ingredients | Instructions
- [ ] Servings adjuster (− / +) that scales ingredient amounts
- [ ] Ingredient list with checkboxes
- [ ] Step-by-step instructions with step numbers
- [ ] Built-in cook timer (set minutes, start/pause/reset)
- [ ] Nutrition summary card (calories, protein, carbs, fat)
- [ ] Save recipe (SharedPreferences)
- [ ] Share recipe (native share sheet)
- [ ] "Watch Video" button → opens YouTube link if available

### ✅ Milestone 6 — Full recipe detail works: tabs, servings, timer, save, share all functional

---

## Phase 7 — Settings Screen

Mirror of the RN `SettingsScreen.js`.

**Tasks:**
- [ ] API server URL input (switch between local and production)
- [ ] Default servings slider (1–8)
- [ ] Dietary preferences toggles (vegetarian, vegan, gluten-free, etc.)
- [ ] Saved recipes list (from SharedPreferences)
- [ ] Clear cache button
- [ ] "Send Feedback" → opens mail composer
- [ ] App version display
- [ ] API health status card (live key usage from `/api/health`)
- [ ] "Coming Soon" modals for unimplemented settings features

### ✅ Milestone 7 — Settings persist across app restarts, API URL switchable, saved recipes accessible

---

## Phase 8 — Shared Widgets & Polish

**Tasks:**
- [ ] `RecipeCard` widget — image, title, time, rating, difficulty chip, likes
- [ ] `RecipeCardSkeleton` — shimmer placeholder while loading
- [ ] `DancingChefLoader` — full-screen animated loading (Lottie or Rive)
- [ ] `SkeletonLoader` — generic shimmer for any list
- [ ] `ComingSoonModal` — reusable animated modal (spinning chef hat, bouncing food emojis)
- [ ] `ErrorView` — retry button + error message
- [ ] `EmptyState` — no results illustration + message
- [ ] Smooth page transitions
- [ ] Haptic feedback on key interactions

### ✅ Milestone 8 — All shared widgets complete, app feels polished and consistent

---

## Phase 9 — Assets & Branding

**Tasks:**
- [ ] Copy logo assets from `app/assets/images/` (logo.png, light-logo.png)
- [ ] Copy splash icon from `app/assets/splash-icon.png`
- [ ] Copy adaptive icon assets (foreground, background, monochrome)
- [ ] Configure `flutter_launcher_icons` for Android + iOS
- [ ] Configure `flutter_native_splash` for splash screen
- [ ] Set app name "FlavorFind" and package `com.flavorfind.app`

### ✅ Milestone 9 — App icon, splash screen, and branding match the original

---

## Phase 10 — Testing & Release Prep

**Tasks:**
- [ ] Test on Android emulator
- [ ] Test on physical Android device
- [ ] Test all API endpoints with local backend
- [ ] Test with production backend URL
- [ ] Fix any layout issues on different screen sizes
- [ ] Run `flutter build apk --release`
- [ ] Run `flutter build appbundle` for Play Store

### ✅ Milestone 10 — Release APK builds successfully, app tested on real device

---

## Summary

| Phase | Focus | Milestone |
|-------|-------|-----------|
| 1 | Setup & Structure | App runs, nav works |
| 2 | API Service | All endpoints + models |
| 3 | Home Screen | Search + trending |
| 4 | Recipes Screen | Ingredient picker + filters |
| 5 | Categories Screen | Browse by cuisine/diet/type |
| 6 | Recipe Detail | Full detail + timer + save |
| 7 | Settings | Persist prefs, health status |
| 8 | Widgets & Polish | Skeletons, loaders, transitions |
| 9 | Assets & Branding | Icons, splash, logo |
| 10 | Testing & Release | APK build, device tested |

**API Base URL:** `http://localhost:8000/api` (dev) → production URL (prod)
**Backend capacity:** 1,050 req/day (7 keys) → 2,250 req/day (15 keys)

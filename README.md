# FlavorFind

Discover amazing recipes based on the ingredients you already have. FlavorFind uses AI-powered matching to suggest perfect recipes tailored to your kitchen inventory.

## Project Structure

```
FlavorFind/
├── android-app/          # Native Android app (Kotlin + Jetpack Compose)
├── backend/              # Node.js/Express API backend
├── index.html            # Website landing page & portal
├── recipes_import.csv    # Recipe database seed
└── README.md            # This file
```

## Tech Stack

- **Android App**: Kotlin, Jetpack Compose, Hilt DI, Retrofit, Coil
- **Website**: HTML5, TailwindCSS, Vanilla JavaScript
- **Backend**: Node.js, Express, MongoDB/REST API
- **APIs**: Spoonacular Recipe API integration

## Getting Started

### Android App
```bash
cd android-app
./gradlew assembleDebug
# APK will be in app/build/outputs/apk/debug/
```

### Backend
```bash
cd backend
npm install
npm run dev
```

### Website
Open `index.html` in a browser or deploy to a static host.

## Features

### App Features
- 🔥 Browse trending recipes
- ⚡ Quick bites (under 30 min)
- 🌍 World cuisines
- 🥗 Healthy options
- 💰 Budget meals
- 🍰 Desserts & more
- 🧑‍🍳 Search by ingredients
- 💾 Save favorites
- ⚙️ Customizable settings

### Website Pages
- Home with hero search
- Recipes & categories
- About FlavorFind
- Privacy Policy
- Terms of Use
- Contact Us

## API Endpoints

All endpoints are served from the backend API. Key routes:
- `GET /api/health` - Health check
- `GET /api/recipes` - Search recipes
- `GET /api/recipes/random` - Random recipes
- `GET /api/recipes/{id}` - Recipe details
- `GET /api/ingredients/autocomplete` - Ingredient suggestions

## Development

### Key Files

**Android App:**
- `android-app/app/src/main/java/com/flavorfind/app/ui/home/HomeScreen.kt` - Main feed
- `android-app/app/src/main/java/com/flavorfind/app/ui/settings/SettingsScreen.kt` - Settings & legal docs
- `android-app/app/src/main/java/com/flavorfind/app/core/theme/` - Design system

**Website:**
- `index.html` - All pages (Home, About, Privacy, Terms, Contact)

**Backend:**
- `backend/app/` - Express routes and controllers
- `backend/config/` - API configuration

## Contact

📧 Email: dallaherick0@gmail.com
💬 WhatsApp: +254 796 605 409
🌐 Website: https://flavorfind.dallah.co.ke

---

**© 2024 FlavorFind** | Discover, Cook, Enjoy

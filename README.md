# FlavorFind

Discover amazing recipes based on the ingredients you already have. FlavorFind is a clean, fast recipe discovery website.

## Project Structure

```
FlavorFind/
├── index.html           # Website (complete, single-page app)
├── recipes_import.csv   # Recipe database seed
├── .env                 # Spoonacular API keys (preserved)
└── README.md           # This file
```

## Tech Stack

- **Website**: HTML5, TailwindCSS, Vanilla JavaScript
- **Recipe Data**: Spoonacular Recipe API

## Getting Started

### Run the Website Locally

```bash
# Using Python 3
python3 -m http.server 8000

# Or using Node.js
npx http-server

# Then open http://localhost:8000 in your browser
```

### Deploy to Production

The website can be deployed to any static hosting:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any CDN

## Website Features

### Pages
- **Home** — Hero search, featured recipes, ingredient search
- **Recipes** — Browse and search recipes by ingredients
- **Categories** — Browse by cuisine, diet type, and meal type
- **About** — Mission and how FlavorFind works
- **Download** — Get the mobile app (Android APK)
- **Privacy Policy** — Full legal documentation
- **Terms of Use** — Full terms
- **Contact Us** — Contact information and FAQ

### Features
- 🔍 Search recipes by ingredients
- 🏷️ Browse by cuisine, diet, and meal type
- ⚡ Fast, optimized performance
- 📱 Responsive mobile design
- 💾 API response caching (5-minute TTL)
- 🎯 Toast notifications with error handling
- ♿ Accessibility compliant

## API Integration

The website uses the **Spoonacular Recipe API** for real-time recipe data.

**API Base**: `https://api.spoonacular.com`

**Endpoints Used**:
- Recipe search and filtering
- Ingredient autocomplete
- Recipe details
- Cuisine and diet category browsing

**Keys**: 7 active API keys configured in `.env` (preserved for future use)

## Deployment

### Static Hosting (Recommended)

Simply upload `index.html` and `recipes_import.csv` to any static host. The website will work immediately with zero server-side dependencies.

### With Spoonacular API Keys

If deploying to a server that can read `.env`, the API keys in `.env` are available for backend use (e.g., for a future backend API layer). Currently the website accesses Spoonacular directly via client-side JavaScript.

## Features Removed

- ❌ Native Android app (Kotlin)
- ❌ Backend API server
- ❌ Mobile app download/distribution

The website remains fully functional as a standalone recipe discovery platform.

## Performance

- **First Load**: ~2-3 seconds
- **Page Transitions**: <100ms
- **API Requests**: Cached for 5 minutes
- **Network Timeout**: 8 seconds per request
- **File Size**: Single `index.html` (~85 KB)

## Contact

📧 Email: dallaherick0@gmail.com
💬 WhatsApp: +254 796 605 409

---

**© 2024 FlavorFind** | Discover, Cook, Enjoy

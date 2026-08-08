# FlavorFind Laravel Backend — Full Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── RecipeController.php        # Search, detail, random, categories
│   │   │   ├── CategoryController.php      # Browse by category/cuisine/diet
│   │   │   └── HealthController.php        # Health check + key stats
│   │   └── Middleware/
│   │       └── ApiKeyRateLimitHeaders.php  # Attach X-Key-Used, X-Requests-Remaining headers
│   ├── Services/
│   │   ├── SpoonacularRouter.php           # Smart API key router (core logic)
│   │   └── SpoonacularService.php          # All Spoonacular API calls
│   └── Models/
│       └── ApiKeyUsage.php                 # Eloquent model for key usage tracking
├── config/
│   └── spoonacular.php                     # Keys array + daily limit config
├── database/
│   └── migrations/
│       └── xxxx_create_api_key_usages_table.php
├── routes/
│   └── api.php                             # All API routes
├── .env.example                            # All required env vars
└── README.md                               # Setup instructions
```

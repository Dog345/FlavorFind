# FlavorFind — Architecture Decision Record
**Date:** 2026-08-15  
**Status:** Agreed

---

## Decision: Modular Monolith First, Microservices Later

### Context
FlavorFind has two product tracks:
1. **Standalone consumer product** — website + Android app for home cooks
2. **Hotel/restaurant platform** — multi-tenant SaaS for hospitality businesses

The question was whether to build as microservices from day one.

### Decision
Build a **modular monolith** now. Split into microservices only when there is a specific reason to (scale, separate teams, independent deployment needs).

### Rationale
- One developer, zero users — microservice infrastructure overhead would consume 80% of build time
- Microservices solve *scale* problems. We don't have scale problems yet.
- Netflix, Uber, Amazon all started as monoliths and split later when they had real reasons to
- A well-structured monolith is faster to build, easier to debug, and cheaper to run

### Structure
The monolith is organised into clean internal modules that can become microservices later with minimal rewriting:

```
backend/
  Modules/
    Ingredients/    ← suggestion engine (co-occurrence + vector)
    Recipes/        ← recipe search and filtering
    Users/          ← auth, profiles, saved recipes
    Hotels/         ← restaurant/hotel side (built last)
```

Modules communicate through internal service classes — they do not call each other's controllers or query each other's tables directly. This is the microservice boundary drawn in code, not in infrastructure.

### Database
One PostgreSQL instance, accessed only by this one backend. When splitting into microservices later, the database splits too — each service gets its own schema or database.

No raw "data API" layer. Business logic (suggestion scoring, ranking, combining signals) lives in the backend, not in a pass-through data layer. Every client would have to re-implement that logic otherwise.

### Build Order
1. **FlavorFind standalone** — ingredient suggestions + recipe search + website + Android app
2. **Hotel module** — once standalone has real users, add as a module
3. **Split into microservices** — only when you have a concrete reason

### Future Microservice Split (when the time comes)
Each module becomes its own service:
- `ingredients-service` — suggestion engine
- `recipes-service` — recipe search  
- `users-service` — auth and profiles
- `hotels-service` — restaurant platform
- `gateway` — single entry point routing to services

The database at that point splits: each service owns its own tables/schema.

---

## What We Are Building Right Now
The standalone FlavorFind product:
- Ingredient suggestion API (done — `combined_suggestions` table, 362,661 pre-computed pairs)
- Recipe search API (next)
- User auth and saved recipes
- FlavorFind website (consumer-facing)
- FlavorFind Android app

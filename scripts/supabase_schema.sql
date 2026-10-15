-- ============================================================
-- FlavorFind — Supabase Schema
-- Paste this entire file into the Supabase SQL editor and run.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── master_ingredients ───────────────────────────────────────────────────────
CREATE TABLE master_ingredients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    category        TEXT,
    description     TEXT,
    allergen_flags  TEXT[],
    flavor_vector   vector(1536),
    recipe_count    INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX mi_name_trgm_idx   ON master_ingredients USING gin (name gin_trgm_ops);
CREATE INDEX mi_name_btree_idx  ON master_ingredients (lower(name) text_pattern_ops);
CREATE INDEX mi_flavor_vec_idx  ON master_ingredients USING ivfflat (flavor_vector vector_cosine_ops) WITH (lists = 100);

-- ─── recipes ──────────────────────────────────────────────────────────────────
CREATE TABLE recipes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       INTEGER UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    category        TEXT,
    description     TEXT,
    cook_time       TEXT,
    prep_time       TEXT,
    total_time      TEXT,
    servings        INTEGER,
    yield           TEXT,
    instructions    JSONB NOT NULL DEFAULT '[]',
    keywords        JSONB NOT NULL DEFAULT '[]',
    calories        NUMERIC(8,2),
    protein_g       NUMERIC(8,2),
    fat_g           NUMERIC(8,2),
    carbs_g         NUMERIC(8,2),
    fiber_g         NUMERIC(8,2),
    sugar_g         NUMERIC(8,2),
    cholesterol_mg  NUMERIC(8,2),
    sodium_mg       NUMERIC(8,2),
    saturated_fat_g NUMERIC(8,2),
    rating          NUMERIC(3,2),
    review_count    INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX recipes_category_idx ON recipes (category);
CREATE INDEX recipes_rating_idx   ON recipes (rating DESC NULLS LAST);
CREATE INDEX recipes_calories_idx ON recipes (calories);
CREATE INDEX recipes_fts_idx      ON recipes
    USING gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'')));

-- ─── recipe_images ────────────────────────────────────────────────────────────
CREATE TABLE recipe_images (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id   UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    sort_order  SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX ri_images_recipe_idx    ON recipe_images (recipe_id);
CREATE INDEX ri_images_covering_idx  ON recipe_images (recipe_id, sort_order ASC) INCLUDE (url);

-- ─── recipe_ingredients ───────────────────────────────────────────────────────
CREATE TABLE recipe_ingredients (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id        UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id    UUID NOT NULL REFERENCES master_ingredients(id) ON DELETE CASCADE,
    quantity         TEXT,
    quantity_numeric NUMERIC(8,3),
    unit             TEXT,
    sort_order       SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX ri_ingredient_idx          ON recipe_ingredients (ingredient_id);
CREATE INDEX ri_recipe_idx              ON recipe_ingredients (recipe_id);
CREATE INDEX ri_ingredient_covering_idx ON recipe_ingredients (ingredient_id) INCLUDE (recipe_id);

-- ─── ingredient_pairings ──────────────────────────────────────────────────────
CREATE TABLE ingredient_pairings (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id         UUID NOT NULL REFERENCES master_ingredients(id) ON DELETE CASCADE,
    paired_ingredient_id  UUID NOT NULL REFERENCES master_ingredients(id) ON DELETE CASCADE,
    co_occurrence_count   INTEGER NOT NULL DEFAULT 0,
    score                 NUMERIC(6,5) NOT NULL DEFAULT 0,
    paired_category       TEXT,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now(),
    UNIQUE (ingredient_id, paired_ingredient_id)
);

CREATE INDEX ip_ingredient_score_idx ON ingredient_pairings (ingredient_id, score DESC);
CREATE INDEX ip_paired_idx           ON ingredient_pairings (paired_ingredient_id);

-- ─── flavorfind_users ─────────────────────────────────────────────────────────
CREATE TABLE flavorfind_users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    email               TEXT UNIQUE NOT NULL,
    password            TEXT NOT NULL,
    avatar_url          TEXT,
    dietary_preferences JSONB NOT NULL DEFAULT '[]',
    email_verified_at   TIMESTAMPTZ,
    remember_token      TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ff_users_email_idx ON flavorfind_users (email);

-- ─── saved_recipes ────────────────────────────────────────────────────────────
CREATE TABLE saved_recipes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES flavorfind_users(id) ON DELETE CASCADE,
    recipe_id   UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    collection  TEXT NOT NULL DEFAULT 'favourites',
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, recipe_id, collection)
);

CREATE INDEX sr_user_created_idx ON saved_recipes (user_id, created_at DESC);

-- ─── search_history ───────────────────────────────────────────────────────────
CREATE TABLE search_history (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID REFERENCES flavorfind_users(id) ON DELETE SET NULL,
    ingredient_ids   JSONB NOT NULL DEFAULT '[]',
    ingredient_names JSONB NOT NULL DEFAULT '[]',
    result_count     INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX sh_user_created_idx ON search_history (user_id, created_at DESC);
CREATE INDEX sh_created_idx      ON search_history (created_at DESC);

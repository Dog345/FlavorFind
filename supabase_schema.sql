-- ========================================
-- FlavorFind Supabase Database Schema
-- ========================================

-- 1. Recipes Table (main recipe data)
CREATE TABLE recipes (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    ready_minutes INTEGER,
    servings INTEGER,
    rating DECIMAL(3,2) DEFAULT 0,
    cuisines TEXT[], -- Array of cuisines
    diets TEXT[], -- Array of diets (vegan, gluten-free, etc.)
    dish_types TEXT[], -- Array of meal types (breakfast, dessert, etc.)
    ingredients JSONB, -- Full ingredient list
    instructions TEXT,
    nutrition JSONB, -- Nutrition data
    source_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Sections Table (15 home sections)
CREATE TABLE sections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50), -- trending, seasonal, chef-signature, etc.
    position INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Section Recipes (many-to-many relationship)
CREATE TABLE section_recipes (
    id SERIAL PRIMARY KEY,
    section_id INTEGER REFERENCES sections(id) ON DELETE CASCADE,
    recipe_id BIGINT REFERENCES recipes(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(section_id, recipe_id)
);

-- 4. Ingredient Categories
CREATE TABLE ingredient_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    slug VARCHAR(100) UNIQUE NOT NULL,
    gradient_start VARCHAR(20),
    gradient_end VARCHAR(20),
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Ingredients
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10),
    color VARCHAR(20),
    category_id INTEGER REFERENCES ingredient_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(name)
);

-- ========================================
-- Indexes for Performance
-- ========================================

-- Recipe search indexes
CREATE INDEX idx_recipes_title ON recipes USING GIN (to_tsvector('english', title));
CREATE INDEX idx_recipes_rating ON recipes(rating DESC);
CREATE INDEX idx_recipes_ready_minutes ON recipes(ready_minutes);
CREATE INDEX idx_recipes_cuisines ON recipes USING GIN (cuisines);
CREATE INDEX idx_recipes_diets ON recipes USING GIN (diets);
CREATE INDEX idx_recipes_dish_types ON recipes USING GIN (dish_types);

-- Section indexes
CREATE INDEX idx_sections_slug ON sections(slug);
CREATE INDEX idx_sections_position ON sections(position);

-- Section recipes indexes
CREATE INDEX idx_section_recipes_section ON section_recipes(section_id);
CREATE INDEX idx_section_recipes_recipe ON section_recipes(recipe_id);
CREATE INDEX idx_section_recipes_position ON section_recipes(section_id, position);

-- Ingredient indexes
CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_category ON ingredients(category_id);
CREATE INDEX idx_ingredient_categories_slug ON ingredient_categories(slug);

-- ========================================
-- Enable Row Level Security (RLS)
-- ========================================

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Public Read Access Policies
-- ========================================

-- Allow public read access to all tables
CREATE POLICY "Allow public read access" ON recipes FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON sections FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON section_recipes FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON ingredient_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON ingredients FOR SELECT USING (true);

-- Admin write access (requires authentication - configure later)
-- For now, disable RLS on write operations by running queries as service_role

-- ========================================
-- Sample Query Examples
-- ========================================

-- Get all sections with their recipes
-- SELECT s.*, 
--        (SELECT json_agg(r.*) 
--         FROM section_recipes sr 
--         JOIN recipes r ON sr.recipe_id = r.id 
--         WHERE sr.section_id = s.id 
--         ORDER BY sr.position) as recipes
-- FROM sections s 
-- ORDER BY s.position;

-- Search recipes by ingredient
-- SELECT * FROM recipes 
-- WHERE ingredients::text ILIKE '%chicken%' 
-- ORDER BY rating DESC 
-- LIMIT 10;

-- Get recipes by cuisine
-- SELECT * FROM recipes 
-- WHERE 'Italian' = ANY(cuisines) 
-- ORDER BY rating DESC;

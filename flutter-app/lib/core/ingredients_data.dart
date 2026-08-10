// Ingredient data for RecipesScreen

class IngredientItem {
  final String name;
  final String emoji;
  final String color;
  const IngredientItem({required this.name, required this.emoji, required this.color});
}

class IngredientCategory {
  final String id;
  final String name;
  final String icon;
  final List<String> gradient;
  final List<IngredientItem> ingredients;
  const IngredientCategory({
    required this.id,
    required this.name,
    required this.icon,
    required this.gradient,
    required this.ingredients,
  });
}

const List<IngredientItem> kPopularIngredients = [
  IngredientItem(name: 'Chicken', emoji: '🍗', color: '#e87a3d'),
  IngredientItem(name: 'Tomato', emoji: '🍅', color: '#e83d3d'),
  IngredientItem(name: 'Cheese', emoji: '🧀', color: '#e8e83d'),
  IngredientItem(name: 'Beef', emoji: '🥩', color: '#e83d3d'),
  IngredientItem(name: 'Rice', emoji: '🍚', color: '#e8a63d'),
  IngredientItem(name: 'Eggs', emoji: '🥚', color: '#e8e83d'),
  IngredientItem(name: 'Pasta', emoji: '🍝', color: '#e8a63d'),
  IngredientItem(name: 'Fish', emoji: '🐟', color: '#3d9ee8'),
  IngredientItem(name: 'Onion', emoji: '🧅', color: '#e8a63d'),
  IngredientItem(name: 'Garlic', emoji: '🧄', color: '#e8a63d'),
  IngredientItem(name: 'Potato', emoji: '🥔', color: '#e8a63d'),
  IngredientItem(name: 'Carrot', emoji: '🥕', color: '#e87a3d'),
];

const List<IngredientCategory> kIngredientCategories = [
  IngredientCategory(
    id: 'veg1', name: '🥬 Leafy Greens', icon: '🥬',
    gradient: ['#4ade80', '#22c55e'],
    ingredients: [
      IngredientItem(name: 'Spinach', emoji: '🥬', color: '#4ade80'),
      IngredientItem(name: 'Kale', emoji: '🥬', color: '#4ade80'),
      IngredientItem(name: 'Lettuce', emoji: '🥬', color: '#4ade80'),
      IngredientItem(name: 'Arugula', emoji: '🥬', color: '#4ade80'),
      IngredientItem(name: 'Cabbage', emoji: '🥬', color: '#4ade80'),
      IngredientItem(name: 'Swiss Chard', emoji: '🥬', color: '#4ade80'),
      IngredientItem(name: 'Romaine', emoji: '🥬', color: '#4ade80'),
      IngredientItem(name: 'Bok Choy', emoji: '🥬', color: '#4ade80'),
    ],
  ),
  IngredientCategory(
    id: 'veg2', name: '🍅 Tomatoes & Peppers', icon: '🍅',
    gradient: ['#e87a3d', '#d96d2f'],
    ingredients: [
      IngredientItem(name: 'Tomato', emoji: '🍅', color: '#e87a3d'),
      IngredientItem(name: 'Cherry Tomatoes', emoji: '🍅', color: '#e87a3d'),
      IngredientItem(name: 'Bell Pepper', emoji: '🫑', color: '#e87a3d'),
      IngredientItem(name: 'Jalapeño', emoji: '🌶️', color: '#e83d3d'),
      IngredientItem(name: 'Red Pepper', emoji: '🌶️', color: '#e83d3d'),
      IngredientItem(name: 'Green Pepper', emoji: '🫑', color: '#4ade80'),
      IngredientItem(name: 'Habanero', emoji: '🌶️', color: '#e83d3d'),
      IngredientItem(name: 'Poblano', emoji: '🌶️', color: '#4ade80'),
    ],
  ),
  IngredientCategory(
    id: 'veg3', name: '🥕 Root Vegetables', icon: '🥕',
    gradient: ['#e8a63d', '#d48a2f'],
    ingredients: [
      IngredientItem(name: 'Carrot', emoji: '🥕', color: '#e8a63d'),
      IngredientItem(name: 'Potato', emoji: '🥔', color: '#e8a63d'),
      IngredientItem(name: 'Sweet Potato', emoji: '🍠', color: '#e8a63d'),
      IngredientItem(name: 'Onion', emoji: '🧅', color: '#e8a63d'),
      IngredientItem(name: 'Garlic', emoji: '🧄', color: '#e8a63d'),
      IngredientItem(name: 'Ginger', emoji: '🧄', color: '#e8a63d'),
      IngredientItem(name: 'Beetroot', emoji: '🥕', color: '#e83d8c'),
      IngredientItem(name: 'Radish', emoji: '🥕', color: '#e83d3d'),
      IngredientItem(name: 'Turnip', emoji: '🥕', color: '#e8a63d'),
      IngredientItem(name: 'Parsnip', emoji: '🥕', color: '#e8a63d'),
    ],
  ),
  IngredientCategory(
    id: 'veg4', name: '🥦 Cruciferous', icon: '🥦',
    gradient: ['#4ade80', '#3d9e6a'],
    ingredients: [
      IngredientItem(name: 'Broccoli', emoji: '🥦', color: '#4ade80'),
      IngredientItem(name: 'Cauliflower', emoji: '🥦', color: '#4ade80'),
      IngredientItem(name: 'Brussels Sprouts', emoji: '🥦', color: '#4ade80'),
      IngredientItem(name: 'Bok Choy', emoji: '🥬', color: '#4ade80'),
      IngredientItem(name: 'Kohlrabi', emoji: '🥦', color: '#4ade80'),
      IngredientItem(name: 'Broccolini', emoji: '🥦', color: '#4ade80'),
    ],
  ),
  IngredientCategory(
    id: 'fruit1', name: '🍎 Fruits - Sweet', icon: '🍎',
    gradient: ['#e83d8c', '#c12b6f'],
    ingredients: [
      IngredientItem(name: 'Apple', emoji: '🍎', color: '#e83d8c'),
      IngredientItem(name: 'Banana', emoji: '🍌', color: '#e8e83d'),
      IngredientItem(name: 'Strawberry', emoji: '🍓', color: '#e83d3d'),
      IngredientItem(name: 'Blueberry', emoji: '🫐', color: '#3d9ee8'),
      IngredientItem(name: 'Mango', emoji: '🥭', color: '#e8a63d'),
      IngredientItem(name: 'Pineapple', emoji: '🍍', color: '#e8e83d'),
      IngredientItem(name: 'Peach', emoji: '🍑', color: '#e8a63d'),
      IngredientItem(name: 'Grapes', emoji: '🍇', color: '#9b59b6'),
    ],
  ),
  IngredientCategory(
    id: 'fruit2', name: '🍋 Citrus', icon: '🍋',
    gradient: ['#e8e83d', '#c9b02a'],
    ingredients: [
      IngredientItem(name: 'Lemon', emoji: '🍋', color: '#e8e83d'),
      IngredientItem(name: 'Lime', emoji: '🍋', color: '#4ade80'),
      IngredientItem(name: 'Orange', emoji: '🍊', color: '#e8a63d'),
      IngredientItem(name: 'Grapefruit', emoji: '🍊', color: '#e83d3d'),
      IngredientItem(name: 'Mandarin', emoji: '🍊', color: '#e87a3d'),
    ],
  ),
  IngredientCategory(
    id: 'protein1', name: '🍗 Poultry', icon: '🍗',
    gradient: ['#e87a3d', '#c4622f'],
    ingredients: [
      IngredientItem(name: 'Chicken Breast', emoji: '🍗', color: '#e87a3d'),
      IngredientItem(name: 'Chicken Thighs', emoji: '🍗', color: '#e87a3d'),
      IngredientItem(name: 'Chicken Wings', emoji: '🍗', color: '#e87a3d'),
      IngredientItem(name: 'Turkey', emoji: '🦃', color: '#e87a3d'),
      IngredientItem(name: 'Duck', emoji: '🦆', color: '#e87a3d'),
      IngredientItem(name: 'Ground Turkey', emoji: '🍗', color: '#e87a3d'),
    ],
  ),
  IngredientCategory(
    id: 'protein2', name: '🥩 Red Meat', icon: '🥩',
    gradient: ['#e83d3d', '#b02f2f'],
    ingredients: [
      IngredientItem(name: 'Beef', emoji: '🥩', color: '#e83d3d'),
      IngredientItem(name: 'Ground Beef', emoji: '🥩', color: '#e83d3d'),
      IngredientItem(name: 'Steak', emoji: '🥩', color: '#e83d3d'),
      IngredientItem(name: 'Lamb', emoji: '🐑', color: '#e83d3d'),
      IngredientItem(name: 'Pork', emoji: '🐷', color: '#e83d8c'),
      IngredientItem(name: 'Bacon', emoji: '🥓', color: '#e83d3d'),
      IngredientItem(name: 'Sausage', emoji: '🌭', color: '#e83d3d'),
    ],
  ),
  IngredientCategory(
    id: 'protein3', name: '🐟 Seafood', icon: '🐟',
    gradient: ['#3d9ee8', '#2d6fa3'],
    ingredients: [
      IngredientItem(name: 'Salmon', emoji: '🐟', color: '#3d9ee8'),
      IngredientItem(name: 'Tuna', emoji: '🐟', color: '#3d9ee8'),
      IngredientItem(name: 'Shrimp', emoji: '🦐', color: '#e87a3d'),
      IngredientItem(name: 'Cod', emoji: '🐟', color: '#3d9ee8'),
      IngredientItem(name: 'Crab', emoji: '🦀', color: '#e83d3d'),
      IngredientItem(name: 'Lobster', emoji: '🦞', color: '#e83d3d'),
      IngredientItem(name: 'Scallops', emoji: '🐚', color: '#e8e83d'),
      IngredientItem(name: 'Squid', emoji: '🦑', color: '#3d9ee8'),
    ],
  ),
  IngredientCategory(
    id: 'dairy1', name: '🧀 Dairy & Eggs', icon: '🧀',
    gradient: ['#e8e83d', '#c9b02a'],
    ingredients: [
      IngredientItem(name: 'Eggs', emoji: '🥚', color: '#e8e83d'),
      IngredientItem(name: 'Milk', emoji: '🥛', color: '#e8e83d'),
      IngredientItem(name: 'Cheese', emoji: '🧀', color: '#e8a63d'),
      IngredientItem(name: 'Butter', emoji: '🧈', color: '#e8e83d'),
      IngredientItem(name: 'Yogurt', emoji: '🥛', color: '#4ade80'),
      IngredientItem(name: 'Cream', emoji: '🥛', color: '#e8e83d'),
      IngredientItem(name: 'Cream Cheese', emoji: '🧀', color: '#e8e83d'),
      IngredientItem(name: 'Sour Cream', emoji: '🥛', color: '#e8e83d'),
    ],
  ),
  IngredientCategory(
    id: 'pantry1', name: '🍚 Grains & Rice', icon: '🍚',
    gradient: ['#e8a63d', '#b57f2f'],
    ingredients: [
      IngredientItem(name: 'Rice', emoji: '🍚', color: '#e8a63d'),
      IngredientItem(name: 'Pasta', emoji: '🍝', color: '#e8a63d'),
      IngredientItem(name: 'Quinoa', emoji: '🌾', color: '#4ade80'),
      IngredientItem(name: 'Oats', emoji: '🌾', color: '#e8a63d'),
      IngredientItem(name: 'Bread', emoji: '🍞', color: '#e8a63d'),
      IngredientItem(name: 'Flour', emoji: '🌾', color: '#e8e83d'),
      IngredientItem(name: 'Couscous', emoji: '🌾', color: '#e8a63d'),
    ],
  ),
  IngredientCategory(
    id: 'spices1', name: '🌶️ Spices & Herbs', icon: '🌶️',
    gradient: ['#e83d3d', '#a32b2b'],
    ingredients: [
      IngredientItem(name: 'Garlic Powder', emoji: '🧄', color: '#e8a63d'),
      IngredientItem(name: 'Paprika', emoji: '🌶️', color: '#e83d3d'),
      IngredientItem(name: 'Cumin', emoji: '🌿', color: '#e8a63d'),
      IngredientItem(name: 'Oregano', emoji: '🌿', color: '#4ade80'),
      IngredientItem(name: 'Basil', emoji: '🌿', color: '#4ade80'),
      IngredientItem(name: 'Cinnamon', emoji: '🌿', color: '#e8a63d'),
      IngredientItem(name: 'Chili Powder', emoji: '🌶️', color: '#e83d3d'),
      IngredientItem(name: 'Turmeric', emoji: '🌿', color: '#e8a63d'),
    ],
  ),
  IngredientCategory(
    id: 'sauces1', name: '🍯 Sauces & Oils', icon: '🍯',
    gradient: ['#e87a3d', '#b55d2f'],
    ingredients: [
      IngredientItem(name: 'Olive Oil', emoji: '🫒', color: '#4ade80'),
      IngredientItem(name: 'Soy Sauce', emoji: '🍯', color: '#e83d3d'),
      IngredientItem(name: 'Hot Sauce', emoji: '🌶️', color: '#e83d3d'),
      IngredientItem(name: 'Ketchup', emoji: '🍅', color: '#e83d3d'),
      IngredientItem(name: 'Mustard', emoji: '🍯', color: '#e8e83d'),
      IngredientItem(name: 'BBQ Sauce', emoji: '🍖', color: '#e83d3d'),
      IngredientItem(name: 'Teriyaki', emoji: '🍜', color: '#e83d3d'),
    ],
  ),
  IngredientCategory(
    id: 'legumes1', name: '🫘 Legumes', icon: '🫘',
    gradient: ['#4ade80', '#2d9e5a'],
    ingredients: [
      IngredientItem(name: 'Lentils', emoji: '🫘', color: '#4ade80'),
      IngredientItem(name: 'Chickpeas', emoji: '🫘', color: '#e8a63d'),
      IngredientItem(name: 'Black Beans', emoji: '🫘', color: '#e83d3d'),
      IngredientItem(name: 'Kidney Beans', emoji: '🫘', color: '#e83d3d'),
      IngredientItem(name: 'Pinto Beans', emoji: '🫘', color: '#e8a63d'),
      IngredientItem(name: 'Soybeans', emoji: '🫘', color: '#4ade80'),
    ],
  ),
  IngredientCategory(
    id: 'nuts1', name: '🥜 Nuts & Seeds', icon: '🥜',
    gradient: ['#e8a63d', '#b57f2f'],
    ingredients: [
      IngredientItem(name: 'Almonds', emoji: '🥜', color: '#e8a63d'),
      IngredientItem(name: 'Walnuts', emoji: '🥜', color: '#e8a63d'),
      IngredientItem(name: 'Cashews', emoji: '🥜', color: '#e8e83d'),
      IngredientItem(name: 'Peanuts', emoji: '🥜', color: '#e8a63d'),
      IngredientItem(name: 'Chia Seeds', emoji: '🌱', color: '#4ade80'),
      IngredientItem(name: 'Pistachios', emoji: '🥜', color: '#4ade80'),
    ],
  ),
  IngredientCategory(
    id: 'herbs1', name: '🌿 Fresh Herbs', icon: '🌿',
    gradient: ['#4ade80', '#2d9e5a'],
    ingredients: [
      IngredientItem(name: 'Parsley', emoji: '🌿', color: '#4ade80'),
      IngredientItem(name: 'Cilantro', emoji: '🌿', color: '#4ade80'),
      IngredientItem(name: 'Mint', emoji: '🌿', color: '#4ade80'),
      IngredientItem(name: 'Rosemary', emoji: '🌿', color: '#4ade80'),
      IngredientItem(name: 'Thyme', emoji: '🌿', color: '#4ade80'),
      IngredientItem(name: 'Sage', emoji: '🌿', color: '#4ade80'),
      IngredientItem(name: 'Chives', emoji: '🌿', color: '#4ade80'),
    ],
  ),
];

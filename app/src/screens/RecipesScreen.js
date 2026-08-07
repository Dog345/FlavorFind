import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  ScrollView,
  Animated,
  Dimensions, // ← MAKE SURE THIS IS HERE
  TextInput,
  Modal,
} from 'react-native';
import { COLORS } from '../constants/config';
import { searchRecipesByIngredients } from '../services/api';
import RecipeCard from '../components/RecipeCard';
import DancingChefLoader from '../components/DancingChefLoader';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

// ============== POPULAR INGREDIENTS FOR QUICK PICKS ==============
const POPULAR_INGREDIENTS = [
  { name: 'Chicken', emoji: '🍗', color: '#e87a3d' },
  { name: 'Tomato', emoji: '🍅', color: '#e83d3d' },
  { name: 'Cheese', emoji: '🧀', color: '#e8e83d' },
  { name: 'Beef', emoji: '🥩', color: '#e83d3d' },
  { name: 'Rice', emoji: '🍚', color: '#e8a63d' },
  { name: 'Eggs', emoji: '🥚', color: '#e8e83d' },
  { name: 'Pasta', emoji: '🍝', color: '#e8a63d' },
  { name: 'Fish', emoji: '🐟', color: '#3d9ee8' },
  { name: 'Onion', emoji: '🧅', color: '#e8a63d' },
  { name: 'Garlic', emoji: '🧄', color: '#e8a63d' },
  { name: 'Potato', emoji: '🥔', color: '#e8a63d' },
  { name: 'Carrot', emoji: '🥕', color: '#e87a3d' },
];

// ============== MASSIVE INGREDIENT DATABASE ==============
const INGREDIENT_CATEGORIES = [
  {
    id: 'veg1',
    name: '🥬 Leafy Greens',
    icon: '🥬',
    gradient: ['#4ade80', '#22c55e'],
    ingredients: [
      { name: 'Spinach', emoji: '🥬', color: '#4ade80' },
      { name: 'Kale', emoji: '🥬', color: '#4ade80' },
      { name: 'Lettuce', emoji: '🥬', color: '#4ade80' },
      { name: 'Arugula', emoji: '🥬', color: '#4ade80' },
      { name: 'Cabbage', emoji: '🥬', color: '#4ade80' },
      { name: 'Swiss Chard', emoji: '🥬', color: '#4ade80' },
      { name: 'Collard Greens', emoji: '🥬', color: '#4ade80' },
      { name: 'Romaine', emoji: '🥬', color: '#4ade80' },
      { name: 'Watercress', emoji: '🥬', color: '#4ade80' },
      { name: 'Bok Choy', emoji: '🥬', color: '#4ade80' },
    ],
  },
  {
    id: 'veg2',
    name: '🍅 Tomatoes & Peppers',
    icon: '🍅',
    gradient: ['#e87a3d', '#d96d2f'],
    ingredients: [
      { name: 'Tomato', emoji: '🍅', color: '#e87a3d' },
      { name: 'Cherry Tomatoes', emoji: '🍅', color: '#e87a3d' },
      { name: 'Bell Pepper', emoji: '🫑', color: '#e87a3d' },
      { name: 'Jalapeño', emoji: '🌶️', color: '#e83d3d' },
      { name: 'Red Pepper', emoji: '🌶️', color: '#e83d3d' },
      { name: 'Green Pepper', emoji: '🫑', color: '#4ade80' },
      { name: 'Yellow Pepper', emoji: '🫑', color: '#e8e83d' },
      { name: 'Orange Pepper', emoji: '🫑', color: '#e87a3d' },
      { name: 'Habanero', emoji: '🌶️', color: '#e83d3d' },
      { name: 'Poblano', emoji: '🌶️', color: '#4ade80' },
    ],
  },
  {
    id: 'veg3',
    name: '🥕 Root Vegetables',
    icon: '🥕',
    gradient: ['#e8a63d', '#d48a2f'],
    ingredients: [
      { name: 'Carrot', emoji: '🥕', color: '#e8a63d' },
      { name: 'Potato', emoji: '🥔', color: '#e8a63d' },
      { name: 'Sweet Potato', emoji: '🍠', color: '#e8a63d' },
      { name: 'Onion', emoji: '🧅', color: '#e8a63d' },
      { name: 'Garlic', emoji: '🧄', color: '#e8a63d' },
      { name: 'Ginger', emoji: '🧄', color: '#e8a63d' },
      { name: 'Beetroot', emoji: '🥕', color: '#e83d8c' },
      { name: 'Radish', emoji: '🥕', color: '#e83d3d' },
      { name: 'Turnip', emoji: '🥕', color: '#e8a63d' },
      { name: 'Parsnip', emoji: '🥕', color: '#e8a63d' },
      { name: 'Celery Root', emoji: '🥕', color: '#e8a63d' },
      { name: 'Horseradish', emoji: '🥕', color: '#e8a63d' },
    ],
  },
  {
    id: 'veg4',
    name: '🥦 Cruciferous',
    icon: '🥦',
    gradient: ['#4ade80', '#3d9e6a'],
    ingredients: [
      { name: 'Broccoli', emoji: '🥦', color: '#4ade80' },
      { name: 'Cauliflower', emoji: '🥦', color: '#4ade80' },
      { name: 'Brussels Sprouts', emoji: '🥦', color: '#4ade80' },
      { name: 'Bok Choy', emoji: '🥬', color: '#4ade80' },
      { name: 'Cabbage', emoji: '🥬', color: '#4ade80' },
      { name: 'Radicchio', emoji: '🥬', color: '#e83d8c' },
      { name: 'Kohlrabi', emoji: '🥦', color: '#4ade80' },
      { name: 'Broccolini', emoji: '🥦', color: '#4ade80' },
    ],
  },
  {
    id: 'fruit1',
    name: '🍎 Fruits - Sweet',
    icon: '🍎',
    gradient: ['#e83d8c', '#c12b6f'],
    ingredients: [
      { name: 'Apple', emoji: '🍎', color: '#e83d8c' },
      { name: 'Banana', emoji: '🍌', color: '#e8e83d' },
      { name: 'Strawberry', emoji: '🍓', color: '#e83d3d' },
      { name: 'Blueberry', emoji: '🫐', color: '#3d9ee8' },
      { name: 'Raspberry', emoji: '🍓', color: '#e83d3d' },
      { name: 'Mango', emoji: '🥭', color: '#e8a63d' },
      { name: 'Pineapple', emoji: '🍍', color: '#e8e83d' },
      { name: 'Peach', emoji: '🍑', color: '#e8a63d' },
      { name: 'Pear', emoji: '🍐', color: '#4ade80' },
      { name: 'Grapes', emoji: '🍇', color: '#9b59b6' },
      { name: 'Watermelon', emoji: '🍉', color: '#e83d3d' },
      { name: 'Cantaloupe', emoji: '🍈', color: '#e8a63d' },
    ],
  },
  {
    id: 'fruit2',
    name: '🍋 Fruits - Citrus',
    icon: '🍋',
    gradient: ['#e8e83d', '#c9b02a'],
    ingredients: [
      { name: 'Lemon', emoji: '🍋', color: '#e8e83d' },
      { name: 'Lime', emoji: '🍋', color: '#4ade80' },
      { name: 'Orange', emoji: '🍊', color: '#e8a63d' },
      { name: 'Grapefruit', emoji: '🍊', color: '#e83d3d' },
      { name: 'Tangerine', emoji: '🍊', color: '#e8a63d' },
      { name: 'Pomelo', emoji: '🍊', color: '#e8e83d' },
      { name: 'Clementine', emoji: '🍊', color: '#e8a63d' },
      { name: 'Mandarin', emoji: '🍊', color: '#e87a3d' },
    ],
  },
  {
    id: 'protein1',
    name: '🍗 Poultry',
    icon: '🍗',
    gradient: ['#e87a3d', '#c4622f'],
    ingredients: [
      { name: 'Chicken Breast', emoji: '🍗', color: '#e87a3d' },
      { name: 'Chicken Thighs', emoji: '🍗', color: '#e87a3d' },
      { name: 'Chicken Wings', emoji: '🍗', color: '#e87a3d' },
      { name: 'Chicken Drumsticks', emoji: '🍗', color: '#e87a3d' },
      { name: 'Turkey', emoji: '🦃', color: '#e87a3d' },
      { name: 'Duck', emoji: '🦆', color: '#e87a3d' },
      { name: 'Whole Chicken', emoji: '🐔', color: '#e87a3d' },
      { name: 'Ground Turkey', emoji: '🍗', color: '#e87a3d' },
      { name: 'Turkey Breast', emoji: '🦃', color: '#e87a3d' },
      { name: 'Quail', emoji: '🐦', color: '#e87a3d' },
    ],
  },
  {
    id: 'protein2',
    name: '🥩 Red Meat',
    icon: '🥩',
    gradient: ['#e83d3d', '#b02f2f'],
    ingredients: [
      { name: 'Beef', emoji: '🥩', color: '#e83d3d' },
      { name: 'Ground Beef', emoji: '🥩', color: '#e83d3d' },
      { name: 'Steak', emoji: '🥩', color: '#e83d3d' },
      { name: 'Lamb', emoji: '🐑', color: '#e83d3d' },
      { name: 'Pork', emoji: '🐷', color: '#e83d8c' },
      { name: 'Bacon', emoji: '🥓', color: '#e83d3d' },
      { name: 'Sausage', emoji: '🌭', color: '#e83d3d' },
      { name: 'Ribs', emoji: '🍖', color: '#e83d3d' },
      { name: 'Veal', emoji: '🥩', color: '#e83d3d' },
      { name: 'Goat', emoji: '🐐', color: '#e83d3d' },
    ],
  },
  {
    id: 'protein3',
    name: '🐟 Seafood',
    icon: '🐟',
    gradient: ['#3d9ee8', '#2d6fa3'],
    ingredients: [
      { name: 'Salmon', emoji: '🐟', color: '#3d9ee8' },
      { name: 'Tuna', emoji: '🐟', color: '#3d9ee8' },
      { name: 'Shrimp', emoji: '🦐', color: '#e87a3d' },
      { name: 'Cod', emoji: '🐟', color: '#3d9ee8' },
      { name: 'Tilapia', emoji: '🐟', color: '#3d9ee8' },
      { name: 'Crab', emoji: '🦀', color: '#e83d3d' },
      { name: 'Lobster', emoji: '🦞', color: '#e83d3d' },
      { name: 'Mussels', emoji: '🦪', color: '#3d9ee8' },
      { name: 'Scallops', emoji: '🐚', color: '#e8e83d' },
      { name: 'Clams', emoji: '🦪', color: '#3d9ee8' },
      { name: 'Oysters', emoji: '🦪', color: '#3d9ee8' },
      { name: 'Squid', emoji: '🦑', color: '#3d9ee8' },
    ],
  },
  {
    id: 'dairy1',
    name: '🧀 Dairy & Eggs',
    icon: '🧀',
    gradient: ['#e8e83d', '#c9b02a'],
    ingredients: [
      { name: 'Eggs', emoji: '🥚', color: '#e8e83d' },
      { name: 'Milk', emoji: '🥛', color: '#e8e83d' },
      { name: 'Cheese', emoji: '🧀', color: '#e8a63d' },
      { name: 'Butter', emoji: '🧈', color: '#e8e83d' },
      { name: 'Yogurt', emoji: '🥛', color: '#4ade80' },
      { name: 'Cream', emoji: '🥛', color: '#e8e83d' },
      { name: 'Cottage Cheese', emoji: '🧀', color: '#e8e83d' },
      { name: 'Sour Cream', emoji: '🥛', color: '#e8e83d' },
      { name: 'Cream Cheese', emoji: '🧀', color: '#e8e83d' },
    ],
  },
  {
    id: 'pantry1',
    name: '🍚 Grains & Rice',
    icon: '🍚',
    gradient: ['#e8a63d', '#b57f2f'],
    ingredients: [
      { name: 'Rice', emoji: '🍚', color: '#e8a63d' },
      { name: 'Pasta', emoji: '🍝', color: '#e8a63d' },
      { name: 'Quinoa', emoji: '🌾', color: '#4ade80' },
      { name: 'Oats', emoji: '🌾', color: '#e8a63d' },
      { name: 'Bread', emoji: '🍞', color: '#e8a63d' },
      { name: 'Flour', emoji: '🌾', color: '#e8e83d' },
      { name: 'Couscous', emoji: '🌾', color: '#e8a63d' },
      { name: 'Barley', emoji: '🌾', color: '#e8a63d' },
      { name: 'Cornmeal', emoji: '🌽', color: '#e8e83d' },
      { name: 'Polenta', emoji: '🌽', color: '#e8e83d' },
    ],
  },
  {
    id: 'pantry2',
    name: '🥫 Canned Goods',
    icon: '🥫',
    gradient: ['#e87a3d', '#b55d2f'],
    ingredients: [
      { name: 'Canned Tomatoes', emoji: '🥫', color: '#e83d3d' },
      { name: 'Canned Beans', emoji: '🥫', color: '#4ade80' },
      { name: 'Canned Corn', emoji: '🥫', color: '#e8e83d' },
      { name: 'Canned Tuna', emoji: '🥫', color: '#3d9ee8' },
      { name: 'Canned Soup', emoji: '🥫', color: '#e87a3d' },
      { name: 'Coconut Milk', emoji: '🥥', color: '#e8e83d' },
      { name: 'Canned Pumpkin', emoji: '🎃', color: '#e87a3d' },
      { name: 'Canned Peaches', emoji: '🍑', color: '#e8a63d' },
    ],
  },
  {
    id: 'spices1',
    name: '🌶️ Spices & Herbs',
    icon: '🌶️',
    gradient: ['#e83d3d', '#a32b2b'],
    ingredients: [
      { name: 'Garlic Powder', emoji: '🧄', color: '#e8a63d' },
      { name: 'Onion Powder', emoji: '🧅', color: '#e8a63d' },
      { name: 'Paprika', emoji: '🌶️', color: '#e83d3d' },
      { name: 'Cumin', emoji: '🌿', color: '#e8a63d' },
      { name: 'Oregano', emoji: '🌿', color: '#4ade80' },
      { name: 'Basil', emoji: '🌿', color: '#4ade80' },
      { name: 'Cinnamon', emoji: '🌿', color: '#e8a63d' },
      { name: 'Salt', emoji: '🧂', color: '#e8e83d' },
      { name: 'Pepper', emoji: '🌶️', color: '#e83d3d' },
      { name: 'Chili Powder', emoji: '🌶️', color: '#e83d3d' },
      { name: 'Turmeric', emoji: '🌿', color: '#e8a63d' },
    ],
  },
  {
    id: 'sauces1',
    name: '🍯 Sauces & Oils',
    icon: '🍯',
    gradient: ['#e87a3d', '#b55d2f'],
    ingredients: [
      { name: 'Olive Oil', emoji: '🫒', color: '#4ade80' },
      { name: 'Soy Sauce', emoji: '🍯', color: '#e83d3d' },
      { name: 'Hot Sauce', emoji: '🌶️', color: '#e83d3d' },
      { name: 'Ketchup', emoji: '🍅', color: '#e83d3d' },
      { name: 'Mustard', emoji: '🍯', color: '#e8e83d' },
      { name: 'Mayonnaise', emoji: '🥚', color: '#e8e83d' },
      { name: 'Vinegar', emoji: '🍶', color: '#e8e83d' },
      { name: 'BBQ Sauce', emoji: '🍖', color: '#e83d3d' },
      { name: 'Teriyaki', emoji: '🍜', color: '#e83d3d' },
    ],
  },
  {
    id: 'frozen1',
    name: '❄️ Frozen Foods',
    icon: '❄️',
    gradient: ['#3d9ee8', '#2d6fa3'],
    ingredients: [
      { name: 'Frozen Peas', emoji: '❄️', color: '#4ade80' },
      { name: 'Frozen Corn', emoji: '❄️', color: '#e8e83d' },
      { name: 'Frozen Spinach', emoji: '❄️', color: '#4ade80' },
      { name: 'Frozen Berries', emoji: '❄️', color: '#e83d8c' },
      { name: 'Frozen Pizza', emoji: '🍕', color: '#e87a3d' },
      { name: 'Ice Cream', emoji: '🍦', color: '#e8e83d' },
      { name: 'Frozen Vegetables', emoji: '❄️', color: '#4ade80' },
      { name: 'Frozen Chicken', emoji: '❄️', color: '#e87a3d' },
    ],
  },
  {
    id: 'herbs1',
    name: '🌿 Fresh Herbs',
    icon: '🌿',
    gradient: ['#4ade80', '#2d9e5a'],
    ingredients: [
      { name: 'Parsley', emoji: '🌿', color: '#4ade80' },
      { name: 'Cilantro', emoji: '🌿', color: '#4ade80' },
      { name: 'Mint', emoji: '🌿', color: '#4ade80' },
      { name: 'Dill', emoji: '🌿', color: '#4ade80' },
      { name: 'Rosemary', emoji: '🌿', color: '#4ade80' },
      { name: 'Thyme', emoji: '🌿', color: '#4ade80' },
      { name: 'Sage', emoji: '🌿', color: '#4ade80' },
      { name: 'Chives', emoji: '🌿', color: '#4ade80' },
      { name: 'Tarragon', emoji: '🌿', color: '#4ade80' },
    ],
  },
  {
    id: 'mushroom1',
    name: '🍄 Mushrooms',
    icon: '🍄',
    gradient: ['#e8a63d', '#b57f2f'],
    ingredients: [
      { name: 'Button Mushrooms', emoji: '🍄', color: '#e8a63d' },
      { name: 'Portobello', emoji: '🍄', color: '#e8a63d' },
      { name: 'Shiitake', emoji: '🍄', color: '#e8a63d' },
      { name: 'Oyster Mushrooms', emoji: '🍄', color: '#e8a63d' },
      { name: 'Truffle', emoji: '🍄', color: '#e83d3d' },
      { name: 'Cremini', emoji: '🍄', color: '#e8a63d' },
      { name: 'Enoki', emoji: '🍄', color: '#e8e83d' },
    ],
  },
  {
    id: 'nuts1',
    name: '🥜 Nuts & Seeds',
    icon: '🥜',
    gradient: ['#e8a63d', '#b57f2f'],
    ingredients: [
      { name: 'Almonds', emoji: '🥜', color: '#e8a63d' },
      { name: 'Walnuts', emoji: '🥜', color: '#e8a63d' },
      { name: 'Cashews', emoji: '🥜', color: '#e8e83d' },
      { name: 'Peanuts', emoji: '🥜', color: '#e8a63d' },
      { name: 'Sunflower Seeds', emoji: '🌻', color: '#e8e83d' },
      { name: 'Chia Seeds', emoji: '🌱', color: '#4ade80' },
      { name: 'Pecans', emoji: '🥜', color: '#e8a63d' },
      { name: 'Pistachios', emoji: '🥜', color: '#4ade80' },
    ],
  },
  {
    id: 'legumes1',
    name: '🫘 Legumes',
    icon: '🫘',
    gradient: ['#4ade80', '#2d9e5a'],
    ingredients: [
      { name: 'Lentils', emoji: '🫘', color: '#4ade80' },
      { name: 'Chickpeas', emoji: '🫘', color: '#e8a63d' },
      { name: 'Black Beans', emoji: '🫘', color: '#e83d3d' },
      { name: 'Kidney Beans', emoji: '🫘', color: '#e83d3d' },
      { name: 'Pinto Beans', emoji: '🫘', color: '#e8a63d' },
      { name: 'Soybeans', emoji: '🫘', color: '#4ade80' },
      { name: 'Black Eyed Peas', emoji: '🫘', color: '#e8e83d' },
    ],
  },
  {
    id: 'bread1',
    name: '🥖 Breads',
    icon: '🥖',
    gradient: ['#e8a63d', '#b57f2f'],
    ingredients: [
      { name: 'White Bread', emoji: '🍞', color: '#e8a63d' },
      { name: 'Whole Wheat', emoji: '🍞', color: '#e8a63d' },
      { name: 'Sourdough', emoji: '🥖', color: '#e8a63d' },
      { name: 'Baguette', emoji: '🥖', color: '#e8a63d' },
      { name: 'Croissant', emoji: '🥐', color: '#e8a63d' },
      { name: 'Tortillas', emoji: '🌮', color: '#e8a63d' },
      { name: 'Ciabatta', emoji: '🥖', color: '#e8a63d' },
      { name: 'Pita', emoji: '🥙', color: '#e8a63d' },
    ],
  },
  {
    id: 'international1',
    name: '🍜 Asian Pantry',
    icon: '🍜',
    gradient: ['#e83d8c', '#b02f6f'],
    ingredients: [
      { name: 'Soy Sauce', emoji: '🍯', color: '#e83d3d' },
      { name: 'Sesame Oil', emoji: '🫒', color: '#e8a63d' },
      { name: 'Rice Vinegar', emoji: '🍶', color: '#e8e83d' },
      { name: 'Mirin', emoji: '🍶', color: '#e8a63d' },
      { name: 'Sriracha', emoji: '🌶️', color: '#e83d3d' },
      { name: 'Hoisin', emoji: '🍯', color: '#e83d3d' },
      { name: 'Oyster Sauce', emoji: '🦪', color: '#e83d3d' },
      { name: 'Fish Sauce', emoji: '🐟', color: '#e83d3d' },
      { name: 'Miso', emoji: '🍜', color: '#e8a63d' },
    ],
  },
  {
    id: 'international2',
    name: '🌮 Mexican Pantry',
    icon: '🌮',
    gradient: ['#e87a3d', '#b55d2f'],
    ingredients: [
      { name: 'Tortillas', emoji: '🌮', color: '#e8a63d' },
      { name: 'Salsa', emoji: '🍅', color: '#e83d3d' },
      { name: 'Guacamole', emoji: '🥑', color: '#4ade80' },
      { name: 'Refried Beans', emoji: '🫘', color: '#e8a63d' },
      { name: 'Jalapeños', emoji: '🌶️', color: '#e83d3d' },
      { name: 'Cilantro', emoji: '🌿', color: '#4ade80' },
      { name: 'Taco Seasoning', emoji: '🌮', color: '#e83d3d' },
    ],
  },
  {
    id: 'international3',
    name: '🍝 Italian Pantry',
    icon: '🍝',
    gradient: ['#e83d3d', '#b02f2f'],
    ingredients: [
      { name: 'Pasta', emoji: '🍝', color: '#e8a63d' },
      { name: 'Tomato Sauce', emoji: '🍅', color: '#e83d3d' },
      { name: 'Olive Oil', emoji: '🫒', color: '#4ade80' },
      { name: 'Parmesan', emoji: '🧀', color: '#e8a63d' },
      { name: 'Basil', emoji: '🌿', color: '#4ade80' },
      { name: 'Oregano', emoji: '🌿', color: '#4ade80' },
      { name: 'Balsamic Vinegar', emoji: '🍶', color: '#e83d3d' },
    ],
  },
];

// ============== COMPONENTS ==============

// Camera Modal Component
const CameraComingSoonModal = ({ visible, onClose }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(spinValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      spinValue.setValue(0);
      scaleValue.setValue(1);
    }
  }, [visible]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#3d9ee8', '#2d6fa3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalContent}
          >
            <View style={styles.modalIconContainer}>
              <Animated.View style={{ transform: [{ rotate: spin }, { scale: scaleValue }] }}>
                <Text style={styles.modalEmoji}>📸</Text>
              </Animated.View>
              <View style={styles.modalSparkles}>
                <Text style={styles.sparkle}>✨</Text>
                <Text style={styles.sparkle}>✨</Text>
                <Text style={styles.sparkle}>✨</Text>
              </View>
            </View>

            <Text style={styles.modalTitle}>AI Camera Coming Soon!</Text>
            
            <View style={styles.modalFeatureList}>
              <View style={styles.modalFeature}>
                <Text style={styles.featureEmoji}>🤳</Text>
                <Text style={styles.featureText}>Snap a photo of your ingredients</Text>
              </View>
              <View style={styles.modalFeature}>
                <Text style={styles.featureEmoji}>🔍</Text>
                <Text style={styles.featureText}>AI recognizes what you have</Text>
              </View>
              <View style={styles.modalFeature}>
                <Text style={styles.featureEmoji}>🍳</Text>
                <Text style={styles.featureText}>Instant recipe matches</Text>
              </View>
            </View>

            <View style={styles.modalBadge}>
              <Text style={styles.modalBadgeText}>🚧 Under Development</Text>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>Can't Wait! 🔥</Text>
            </TouchableOpacity>

            <Text style={styles.modalFooter}>
              We're cooking up something special...
            </Text>
          </LinearGradient>
        </View>
      </BlurView>
    </Modal>
  );
};

const SelectedIngredient = ({ ingredient, onRemove }) => {
  return (
    <Animated.View style={styles.selectedIngredient}>
      <Text style={styles.selectedIngredientEmoji}>{ingredient.emoji}</Text>
      <Text style={styles.selectedIngredientText}>{ingredient.name}</Text>
      <TouchableOpacity onPress={() => onRemove(ingredient)} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const CategoryCard = ({ category, expanded, onToggle, onIngredientSelect, selectedIngredients }) => {
  const [showAll, setShowAll] = useState(false);
  const displayedIngredients = showAll ? category.ingredients : category.ingredients.slice(0, 4);

  return (
    <LinearGradient
      colors={category.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.categoryCard}
    >
      <TouchableOpacity onPress={onToggle} style={styles.categoryHeader}>
        <View style={styles.categoryTitleContainer}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={styles.categoryName}>{category.name}</Text>
        </View>
        <Text style={styles.categoryExpandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.categoryContent}>
          <View style={styles.ingredientsGrid}>
            {displayedIngredients.map((ingredient) => {
              const isSelected = selectedIngredients.some(i => i.name === ingredient.name);
              return (
                <TouchableOpacity
                  key={ingredient.name}
                  style={[
                    styles.ingredientItem,
                    isSelected && styles.ingredientItemSelected,
                  ]}
                  onPress={() => onIngredientSelect(ingredient)}
                >
                  <Text style={styles.ingredientEmoji}>{ingredient.emoji}</Text>
                  <Text style={[
                    styles.ingredientName,
                    isSelected && styles.ingredientNameSelected,
                  ]}>
                    {ingredient.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {category.ingredients.length > 4 && (
            <TouchableOpacity 
              style={styles.showMoreButton}
              onPress={() => setShowAll(!showAll)}
            >
              <Text style={styles.showMoreText}>
                {showAll ? 'Show Less ▲' : `Show ${category.ingredients.length - 4} More ▼`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </LinearGradient>
  );
};

// ============== MAIN SCREEN ==============
const RecipesScreen = ({ navigation }) => {
  const [manualInput, setManualInput] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleIngredientSelect = (ingredient) => {
    setSelectedIngredients(prev => {
      const exists = prev.some(i => i.name === ingredient.name);
      if (exists) {
        return prev.filter(i => i.name !== ingredient.name);
      } else {
        return [...prev, ingredient];
      }
    });
  };

  const handleAddPopularIngredient = (ingredient) => {
    setSelectedIngredients(prev => {
      const exists = prev.some(i => i.name === ingredient.name);
      if (!exists) {
        return [...prev, ingredient];
      }
      return prev;
    });
  };

  const handleRemoveIngredient = (ingredientToRemove) => {
    setSelectedIngredients(prev => prev.filter(i => i.name !== ingredientToRemove.name));
  };

  const handleManualSearch = async () => {
    if (!manualInput.trim() && selectedIngredients.length === 0) {
      Alert.alert('No Ingredients', 'Please type or select some ingredients');
      return;
    }

    let ingredientsString = '';
    
    if (manualInput.trim()) {
      ingredientsString = manualInput;
    } else {
      ingredientsString = selectedIngredients.map(i => i.name.toLowerCase()).join(',');
    }
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const results = await searchRecipesByIngredients(ingredientsString);
      setRecipes(results);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFromSelected = async () => {
    if (selectedIngredients.length === 0) {
      Alert.alert('No Ingredients', 'Please select some ingredients first');
      return;
    }

    const ingredientsString = selectedIngredients.map(i => i.name.toLowerCase()).join(',');
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const results = await searchRecipesByIngredients(ingredientsString);
      setRecipes(results);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = () => {
    setCameraModalVisible(true);
  };

  const handleClearAll = () => {
    setSelectedIngredients([]);
    setManualInput('');
    setHasSearched(false);
    setRecipes([]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  if (loading) {
    return <DancingChefLoader message="Finding recipes with your ingredients..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraComingSoonModal 
        visible={cameraModalVisible} 
        onClose={() => setCameraModalVisible(false)} 
      />

      {/* Selected Ingredients Bar */}
      {selectedIngredients.length > 0 && (
        <LinearGradient
          colors={[COLORS.card, COLORS.background]}
          style={styles.selectedBar}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectedContainer}>
              {selectedIngredients.map((ingredient) => (
                <SelectedIngredient
                  key={ingredient.name}
                  ingredient={ingredient}
                  onRemove={handleRemoveIngredient}
                />
              ))}
            </View>
          </ScrollView>
          
          <View style={styles.searchActions}>
            <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.searchNowButton} onPress={handleSearchFromSelected}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.searchNowGradient}
              >
                <Text style={styles.searchNowText}>Find Recipes</Text>
                <Text style={styles.searchNowCount}>{selectedIngredients.length}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}

      {!hasSearched ? (
        <FlatList
          data={INGREDIENT_CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CategoryCard
              category={item}
              expanded={expandedCategories[item.id] || false}
              onToggle={() => toggleCategory(item.id)}
              onIngredientSelect={handleIngredientSelect}
              selectedIngredients={selectedIngredients}
            />
          )}
          ListHeaderComponent={
            <View style={styles.header}>
              {/* Manual Search Section */}
              <View style={styles.manualSearchSection}>
                <Text style={styles.searchSectionTitle}>🔍 Manual Search</Text>
                <View style={styles.searchInputContainer}>
                  <Text style={styles.searchInputIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Type ingredients (e.g., chicken, rice, tomatoes)"
                    placeholderTextColor={COLORS.textSecondary}
                    value={manualInput}
                    onChangeText={setManualInput}
                    onSubmitEditing={handleManualSearch}
                    returnKeyType="search"
                  />
                  {manualInput.length > 0 && (
                    <TouchableOpacity onPress={() => setManualInput('')} style={styles.clearInput}>
                      <Text style={styles.clearInputText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity style={styles.manualSearchButton} onPress={handleManualSearch}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.manualSearchGradient}
                  >
                    <Text style={styles.manualSearchText}>Search Manually</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* OR Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Image Upload Card */}
              <TouchableOpacity activeOpacity={0.9} onPress={handleImageUpload}>
                <LinearGradient
                  colors={['#3d9ee8', '#2d6fa3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.imageUploadCard}
                >
                  <View style={styles.imageUploadContent}>
                    <Text style={styles.imageUploadEmoji}>📸</Text>
                    <View style={styles.imageUploadText}>
                      <Text style={styles.imageUploadTitle}>Snap a Photo</Text>
                      <Text style={styles.imageUploadSubtitle}>AI-powered ingredient recognition</Text>
                    </View>
                  </View>
                  <View style={styles.comingSoonPill}>
                    <Text style={styles.comingSoonPillText}>Coming Soon</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Quick Picks */}
              <View style={styles.quickPicksSection}>
                <Text style={styles.searchSectionTitle}>⚡ Quick Picks</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.quickPicksContainer}>
                    {POPULAR_INGREDIENTS.map((ing) => (
                      <TouchableOpacity
                        key={ing.name}
                        style={[
                          styles.quickPickItem,
                          selectedIngredients.some(i => i.name === ing.name) && styles.quickPickItemSelected
                        ]}
                        onPress={() => handleAddPopularIngredient(ing)}
                      >
                        <Text style={styles.quickPickEmoji}>{ing.emoji}</Text>
                        <Text style={[
                          styles.quickPickName,
                          selectedIngredients.some(i => i.name === ing.name) && styles.quickPickNameSelected
                        ]}>
                          {ing.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Categories Header */}
              <View style={styles.categoriesHeader}>
                <Text style={styles.searchSectionTitle}>📚 Browse Categories</Text>
                <Text style={styles.categoriesSubtitle}>
                  Tap ingredients to add them to your search
                </Text>
              </View>
            </View>
          }
          ListFooterComponent={<View style={{ height: selectedIngredients.length > 0 ? 100 : 30 }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        />
      ) : (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <View>
              <Text style={styles.resultsTitle}>
                Found <Text style={styles.resultsCount}>{recipes.length}</Text> Recipes
              </Text>
              <Text style={styles.resultsSubtitle}>
                {selectedIngredients.length > 0 
                  ? `with ${selectedIngredients.length} ingredients`
                  : `for "${manualInput}"`
                }
              </Text>
            </View>
            <TouchableOpacity onPress={handleClearAll} style={styles.resultsClearButton}>
              <Text style={styles.resultsClearText}>← New Search</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={recipes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <RecipeCard 
                recipe={item} 
                onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
              />
            )}
            contentContainerStyle={styles.recipesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Image 
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/149/149852.png' }}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>No recipes found</Text>
                <Text style={styles.emptyText}>
                  Try different ingredient combinations
                </Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
  },
  manualSearchSection: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  searchSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInputIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 14,
  },
  clearInput: {
    padding: 4,
  },
  clearInputText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  manualSearchButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  manualSearchGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  manualSearchText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textSecondary,
    marginHorizontal: 10,
    fontSize: 12,
  },
  imageUploadCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageUploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageUploadEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  imageUploadText: {
    flex: 1,
  },
  imageUploadTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  imageUploadSubtitle: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.9,
  },
  comingSoonPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  comingSoonPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  quickPicksSection: {
    marginBottom: 20,
  },
  quickPicksContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  quickPickItem: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickPickItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickPickEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  quickPickName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  quickPickNameSelected: {
    color: '#fff',
  },
  categoriesHeader: {
    marginBottom: 12,
  },
  categoriesSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  categoryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  categoryName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryExpandIcon: {
    color: '#fff',
    fontSize: 14,
  },
  categoryContent: {
    padding: 16,
    paddingTop: 0,
  },
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientItem: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ingredientItemSelected: {
    backgroundColor: '#fff',
    borderColor: COLORS.primary,
  },
  ingredientEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  ingredientName: {
    color: '#fff',
    fontSize: 12,
  },
  ingredientNameSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  showMoreButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  showMoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  selectedBar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  selectedContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  selectedIngredient: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIngredientEmoji: {
    fontSize: 14,
    marginRight: 4,
    color: '#fff',
  },
  selectedIngredientText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 8,
  },
  removeButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearAllButton: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearAllText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  searchNowButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchNowGradient: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  searchNowText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchNowCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    color: '#fff',
    fontSize: 12,
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  resultsSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  resultsCount: {
    color: COLORS.primary,
  },
  resultsClearButton: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resultsClearText: {
    color: COLORS.text,
    fontSize: 14,
  },
  recipesList: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    marginBottom: 16,
    tintColor: COLORS.textSecondary,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalContent: {
    width: width * 0.85,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  modalIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  modalEmoji: {
    fontSize: 80,
  },
  modalSparkles: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  sparkle: {
    fontSize: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalFeatureList: {
    width: '100%',
    marginBottom: 20,
  },
  modalFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 12,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  modalBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    marginBottom: 20,
  },
  modalBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#3d9ee8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalFooter: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default RecipesScreen;
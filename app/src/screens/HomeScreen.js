import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  Image,
  RefreshControl,
  Animated,
  Dimensions, // ← MAKE SURE THIS IS HERE
  StatusBar,
} from 'react-native';
import { COLORS } from '../constants/config';
import { searchRecipesByIngredients, testConnection, getDailyUsage } from '../services/api';
import RecipeCard from '../components/RecipeCard';
import DancingChefLoader from '../components/DancingChefLoader';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ============== MASSIVE RECIPE DATASET ==============
const TRENDING_NOW = [

  {
    id: 2,
    title: 'Honey Glazed Salmon',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
    ingredients: 'salmon,honey,soy sauce,garlic,ginger',
    time: '20 min',
    rating: 4.8,
    likes: '8.7k',
    chef: 'James Rodriguez',
    difficulty: 'Medium',
  },
  {
    id: 3,
    title: 'Ultimate Burger',
    image: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=400',
    ingredients: 'beef,buns,lettuce,tomato,cheese,onion',
    time: '35 min',
    rating: 4.9,
    likes: '15.2k',
    chef: 'Mike Johnson',
    difficulty: 'Medium',
  },
  {
    id: 4,
    title: 'Sushi Roll Platter',
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400',
    ingredients: 'rice,fish,seaweed,avocado,cucumber',
    time: '45 min',
    rating: 4.9,
    likes: '10.8k',
    chef: 'Yuki Tanaka',
    difficulty: 'Hard',
  },
  {
    id: 5,
    title: 'Chicken Tikka Masala',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
    ingredients: 'chicken,tomato,cream,spices,rice',
    time: '50 min',
    rating: 5.0,
    likes: '18.5k',
    chef: 'Raj Patel',
    difficulty: 'Medium',
  },
    {
    id: 1,
    title: 'Creamy Garlic Pasta',
    image: 'https://images.unsplash.com/photo-1645112411342-4665ad1698a0?w=400',
    ingredients: 'pasta,garlic,cream,cheese,butter',
    time: '25 min',
    rating: 4.9,
    likes: '12.3k',
    chef: 'Maria Chen',
    difficulty: 'Easy',
  },
];

const QUICK_BITES = [
  {
    id: 101,
    title: '2-Min Microwave Mug Brownie',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
    ingredients: 'flour,sugar,cocoa,eggs,milk',
    time: '2 min',
    calories: 320,
    badge: '🍫 Dessert',
  },
  {
    id: 102,
    title: '5-Min Avocado Toast',
    image: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e0?w=400',
    ingredients: 'bread,avocado,eggs,salt,pepper',
    time: '5 min',
    calories: 280,
    badge: '🥑 Healthy',
  },
  {
    id: 103,
    title: '3-Min Greek Yogurt Bowl',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    ingredients: 'yogurt,honey,berries,granola',
    time: '3 min',
    calories: 220,
    badge: '🫐 Breakfast',
  },
  {
    id: 104,
    title: '1-Min Peanut Butter Banana',
    image: 'https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?w=400',
    ingredients: 'banana,peanut butter,honey',
    time: '1 min',
    calories: 190,
    badge: '⚡ Energy',
  },
  {
    id: 105,
    title: '4-Min Caprese Salad',
    image: 'https://images.unsplash.com/photo-1608898830267-3eb5fbe3b5c7?w=400',
    ingredients: 'tomato,mozzarella,basil,olive oil',
    time: '4 min',
    calories: 240,
    badge: '🇮🇹 Italian',
  },
];

const WORLD_CUISINES = [
  { id: 'it', name: 'Italian', flag: '🇮🇹', ingredients: 'pasta,tomato,cheese,olive oil,basil', color: '#e87a3d' },
  { id: 'jp', name: 'Japanese', flag: '🇯🇵', ingredients: 'rice,fish,soy sauce,seaweed,tofu', color: '#e83d8c' },
  { id: 'mx', name: 'Mexican', flag: '🇲🇽', ingredients: 'beans,rice,avocado,tortilla,chili', color: '#e83d3d' },
  { id: 'in', name: 'Indian', flag: '🇮🇳', ingredients: 'rice,spices,chicken,lentils,curry', color: '#e8a63d' },
  { id: 'th', name: 'Thai', flag: '🇹🇭', ingredients: 'coconut milk,rice,noodles,chili,ginger', color: '#3de87a' },
  { id: 'fr', name: 'French', flag: '🇫🇷', ingredients: 'butter,cream,herbs,onion,wine', color: '#3d9ee8' },
  { id: 'gr', name: 'Greek', flag: '🇬🇷', ingredients: 'olive oil,feta,olives,lemon,oregano', color: '#4ade80' },
  { id: 'lb', name: 'Lebanese', flag: '🇱🇧', ingredients: 'chickpeas,garlic,lemon,tahini,lamb', color: '#e88a3d' },
  { id: 'vn', name: 'Vietnamese', flag: '🇻🇳', ingredients: 'rice noodles,fish sauce,herbs,lime', color: '#3de8b0' },
  { id: 'kr', name: 'Korean', flag: '🇰🇷', ingredients: 'rice,gochujang,tofu,vegetables,beef', color: '#e83d5e' },
];

const SEASONAL_SPOTLIGHT = [
  {
    id: 201,
    title: 'Pumpkin Spice Latte Cake',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    ingredients: 'pumpkin,flour,eggs,spices,cream',
    season: '🍂 Fall',
    month: 'October',
  },
  {
    id: 202,
    title: 'Summer Berry Tart',
    image: 'https://images.unsplash.com/photo-1464305795435-96a6b9b7a7b4?w=400',
    ingredients: 'berries,flour,butter,sugar,eggs',
    season: '☀️ Summer',
    month: 'July',
  },
  {
    id: 203,
    title: 'Spring Asparagus Risotto',
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400',
    ingredients: 'rice,asparagus,parmesan,broth,lemon',
    season: '🌱 Spring',
    month: 'April',
  },
  {
    id: 204,
    title: 'Winter Beef Wellington',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
    ingredients: 'beef,mushrooms,pastry,eggs,thyme',
    season: '❄️ Winter',
    month: 'December',
  },
  {
    id: 205,
    title: 'Spring Lamb Chops',
    image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400',
    ingredients: 'lamb,rosemary,garlic,olive oil,potatoes',
    season: '🌱 Spring',
    month: 'May',
  },
];

const CHEF_SIGNATURE = [
  {
    id: 301,
    title: 'Beef Wellington',
    chef: 'Gordon Ramsay',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
    ingredients: 'beef,mushrooms,puff pastry,eggs,prosciutto',
    difficulty: 'Expert',
    time: '2.5 hours',
    rating: 5.0,
  },
  {
    id: 302,
    title: 'Tiramisu',
    chef: 'Massimo Bottura',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    ingredients: 'mascarpone,eggs,sugar,coffee,ladyfingers',
    difficulty: 'Medium',
    time: '1 hour',
    rating: 4.9,
  },
  {
    id: 303,
    title: 'Sushi Omakase',
    chef: 'Jiro Ono',
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400',
    ingredients: 'rice,fish,seaweed,wasabi,soy sauce',
    difficulty: 'Expert',
    time: '3 hours',
    rating: 5.0,
  },
];

const HEALTHY_HEROES = [
  {
    id: 401,
    title: 'Quinoa Buddha Bowl',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    ingredients: 'quinoa,chickpeas,avocado,kale,lemon',
    calories: 420,
    protein: '18g',
    time: '20 min',
  },
  {
    id: 402,
    title: 'Grilled Chicken Salad',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    ingredients: 'chicken,lettuce,tomato,cucumber,olives',
    calories: 380,
    protein: '32g',
    time: '25 min',
  },
  {
    id: 403,
    title: 'Zucchini Noodles',
    image: 'https://images.unsplash.com/photo-1515516969-d4008cc6241a?w=400',
    ingredients: 'zucchini,tomato,garlic,basil,olive oil',
    calories: 210,
    protein: '8g',
    time: '15 min',
  },
];

const DESSERT_PARADISE = [
  {
    id: 501,
    title: 'Molten Chocolate Cake',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
    ingredients: 'chocolate,flour,eggs,butter,sugar',
    time: '30 min',
    difficulty: 'Medium',
  },
  {
    id: 502,
    title: 'French Macarons',
    image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400',
    ingredients: 'almond flour,eggs whites,sugar,food coloring',
    time: '2 hours',
    difficulty: 'Hard',
  },
  {
    id: 503,
    title: 'New York Cheesecake',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400',
    ingredients: 'cream cheese,graham crackers,eggs,sugar',
    time: '1.5 hours',
    difficulty: 'Medium',
  },
];

const COMFORT_FOOD = [
  {
    id: 601,
    title: 'Mac & Cheese',
    image: 'https://images.unsplash.com/photo-1543339494-b4cd4b7e1b2d?w=400',
    ingredients: 'pasta,cheddar,milk,butter,flour',
    time: '30 min',
    mood: '😌 Cozy',
  },
  {
    id: 602,
    title: 'Chicken Pot Pie',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    ingredients: 'chicken,carrots,peas,pie crust,cream',
    time: '1 hour',
    mood: '🏡 Homestyle',
  },
  {
    id: 603,
    title: 'Mashed Potatoes',
    image: 'https://images.unsplash.com/photo-1608830524289-0adcbe822b40?w=400',
    ingredients: 'potatoes,butter,milk,garlic,chives',
    time: '25 min',
    mood: '❤️ Comfort',
  },
];

const DATE_NIGHT = [
  {
    id: 701,
    title: 'Lobster Thermidor',
    image: 'https://images.unsplash.com/photo-1533682805518-48d1f5b8cd3a?w=400',
    ingredients: 'lobster,cream,cheese,mustard,brandy',
    time: '1.5 hours',
    occasion: '💕 Romantic',
  },
  {
    id: 702,
    title: 'Beef Tenderloin',
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400',
    ingredients: 'beef,rosemary,garlic,butter,thyme',
    time: '45 min',
    occasion: '✨ Special',
  },
];

const BREAKFAST_CLUB = [
  {
    id: 801,
    title: 'Fluffy Pancakes',
    image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400',
    ingredients: 'flour,eggs,milk,butter,maple syrup',
    time: '20 min',
    type: '🥞 Weekend',
  },
  {
    id: 802,
    title: 'Eggs Benedict',
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400',
    ingredients: 'eggs,english muffin,ham,hollandaise',
    time: '25 min',
    type: '✨ Fancy',
  },
];

const VEGAN_VIBES = [
  {
    id: 901,
    title: 'Vegan Buddha Bowl',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    ingredients: 'quinoa,tofu,avocado,spinach,tahini',
    time: '20 min',
    diet: '🌱 Plant-based',
  },
  {
    id: 902,
    title: 'Cauliflower Wings',
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400',
    ingredients: 'cauliflower,flour,hot sauce,garlic powder',
    time: '35 min',
    diet: '🌱 Vegan',
  },
];

const DRINKS_COCKTAILS = [
  {
    id: 1001,
    title: 'Mojito',
    image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400',
    ingredients: 'rum,mint,lime,sugar,soda water',
    time: '5 min',
    type: '🍹 Refreshing',
  },
  {
    id: 1002,
    title: 'Espresso Martini',
    image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400',
    ingredients: 'vodka,espresso,coffee liqueur,syrup',
    time: '5 min',
    type: '☕ After dinner',
  },
];

const BUDGET_MEALS = [
  {
    id: 1101,
    title: '$10 Pasta Night',
    image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400',
    ingredients: 'pasta,tomato,garlic,onion,cheese',
    time: '20 min',
    cost: '💰 Under $10',
  },
  {
    id: 1102,
    title: 'Rice and Beans',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
    ingredients: 'rice,beans,onion,spices,tomato',
    time: '25 min',
    cost: '💰💰 $5 meal',
  },
];

const MEAL_PREP = [
  {
    id: 1201,
    title: 'Weekly Chicken Prep',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400',
    ingredients: 'chicken,broccoli,rice,olive oil,seasonings',
    time: '1.5 hours',
    servings: '4 meals',
  },
];

const KIDS_FAVORITES = [
  {
    id: 1301,
    title: 'Funny Face Pancakes',
    image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400',
    ingredients: 'pancake mix,berries,banana,chocolate chips',
    time: '20 min',
    kids: '👶 Kid-approved',
  },
];

const COOKING_TIPS = [
  { id: 1, tip: 'Rest meat 10 mins after cooking', emoji: '🥩' },
  { id: 2, tip: 'Room temp eggs for baking', emoji: '🥚' },
  { id: 3, tip: 'Salt pasta water like the sea', emoji: '🍝' },
  { id: 4, tip: 'Sharp knife = safer knife', emoji: '🔪' },
  { id: 5, tip: 'Mise en place = organized', emoji: '🧑‍🍳' },
  { id: 6, tip: 'Taste as you cook', emoji: '👅' },
  { id: 7, tip: 'Let dough rest', emoji: '🍞' },
  { id: 8, tip: 'Hot pan = better sear', emoji: '🔥' },
];

// ============== COMPONENTS ==============

const GradientCard = ({ children, colors = [COLORS.primary + '80', COLORS.card], style }) => (
  <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gradientCard, style]}>
    {children}
  </LinearGradient>
);

const SectionHeader = ({ title, subtitle, seeAll = true, onSeeAll }) => (
  <View style={styles.sectionHeader}>
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {seeAll && (
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={styles.seeAllText}>See All →</Text>
      </TouchableOpacity>
    )}
  </View>
);

const TrendingCard = ({ item, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={onPress}
    >
      <Animated.View style={[styles.trendingCard, { transform: [{ scale }] }]}>
        <Image source={{ uri: item.image }} style={styles.trendingImage} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.trendingGradient}>
          <View style={styles.trendingBadge}>
            <Text style={styles.trendingBadgeText}>⭐ {item.rating}</Text>
          </View>
          <Text style={styles.trendingTitle}>{item.title}</Text>
          <View style={styles.trendingMeta}>
            <Text style={styles.trendingChef}>👨‍🍳 {item.chef}</Text>
            <Text style={styles.trendingTime}>⏱ {item.time}</Text>
          </View>
          <Text style={styles.trendingLikes}>❤️ {item.likes}</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const QuickBiteCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.quickBiteCard} onPress={onPress}>
    <Image source={{ uri: item.image }} style={styles.quickBiteImage} />
    <View style={styles.quickBiteBadge}>
      <Text style={styles.quickBiteBadgeText}>{item.badge}</Text>
    </View>
    <View style={styles.quickBiteContent}>
      <Text style={styles.quickBiteTitle}>{item.title}</Text>
      <View style={styles.quickBiteMeta}>
        <Text style={styles.quickBiteTime}>⏱ {item.time}</Text>
        <Text style={styles.quickBiteCalories}>🔥 {item.calories} cal</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const CuisineCircle = ({ item, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
    >
      <Animated.View style={[styles.cuisineCircle, { transform: [{ scale }], backgroundColor: item.color + '20' }]}>
        <Text style={styles.cuisineFlag}>{item.flag}</Text>
        <Text style={[styles.cuisineName, { color: item.color }]}>{item.name}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const SeasonalCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.seasonalCard} onPress={onPress}>
    <Image source={{ uri: item.image }} style={styles.seasonalImage} />
    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.seasonalOverlay}>
      <View style={styles.seasonalBadge}>
        <Text style={styles.seasonalBadgeText}>{item.season}</Text>
      </View>
      <Text style={styles.seasonalTitle}>{item.title}</Text>
      <Text style={styles.seasonalMonth}>{item.month}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const ChefCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.chefCard} onPress={onPress}>
    <Image source={{ uri: item.image }} style={styles.chefImage} />
    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.chefGradient}>
      <Text style={styles.chefTitle}>{item.title}</Text>
      <Text style={styles.chefName}>by {item.chef}</Text>
      <View style={styles.chefMeta}>
        <Text style={styles.chefDifficulty}>{item.difficulty}</Text>
        <Text style={styles.chefTime}>⏱ {item.time}</Text>
        <Text style={styles.chefRating}>⭐ {item.rating}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const HealthCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.healthCard} onPress={onPress}>
    <Image source={{ uri: item.image }} style={styles.healthImage} />
    <View style={styles.healthContent}>
      <Text style={styles.healthTitle}>{item.title}</Text>
      <View style={styles.healthStats}>
        <Text style={styles.healthCalories}>🔥 {item.calories} cal</Text>
        <Text style={styles.healthProtein}>💪 {item.protein}</Text>
        <Text style={styles.healthTime}>⏱ {item.time}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const DessertCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.dessertCard} onPress={onPress}>
    <Image source={{ uri: item.image }} style={styles.dessertImage} />
    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.dessertOverlay}>
      <Text style={styles.dessertTitle}>{item.title}</Text>
      <View style={styles.dessertMeta}>
        <Text style={styles.dessertTime}>⏱ {item.time}</Text>
        <Text style={styles.dessertDifficulty}>{item.difficulty}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const ComfortCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.comfortCard} onPress={onPress}>
    <Image source={{ uri: item.image }} style={styles.comfortImage} />
    <View style={styles.comfortOverlay}>
      <Text style={styles.comfortMood}>{item.mood}</Text>
      <Text style={styles.comfortTitle}>{item.title}</Text>
      <Text style={styles.comfortTime}>⏱ {item.time}</Text>
    </View>
  </TouchableOpacity>
);

const DateNightCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.dateCard} onPress={onPress}>
    <Image source={{ uri: item.image }} style={styles.dateImage} />
    <LinearGradient colors={['transparent', 'rgba(232,122,61,0.9)']} style={styles.dateOverlay}>
      <Text style={styles.dateOccasion}>{item.occasion}</Text>
      <Text style={styles.dateTitle}>{item.title}</Text>
      <Text style={styles.dateTime}>⏱ {item.time}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const BreakfastCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.breakfastCard} onPress={onPress}>
    <Image source={{ uri: item.image }} style={styles.breakfastImage} />
    <View style={styles.breakfastContent}>
      <Text style={styles.breakfastType}>{item.type}</Text>
      <Text style={styles.breakfastTitle}>{item.title}</Text>
      <Text style={styles.breakfastTime}>⏱ {item.time}</Text>
    </View>
  </TouchableOpacity>
);

const VeganCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.veganCard} onPress={onPress}>
    <Image source={{ uri: item.image }} style={styles.veganImage} />
    <View style={styles.veganBadge}>
      <Text style={styles.veganBadgeText}>{item.diet}</Text>
    </View>
    <Text style={styles.veganTitle}>{item.title}</Text>
    <Text style={styles.veganTime}>⏱ {item.time}</Text>
  </TouchableOpacity>
);

const DrinkCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.drinkCard} onPress={onPress}>
    <Image source={{ uri: item.image }} style={styles.drinkImage} />
    <View style={styles.drinkContent}>
      <Text style={styles.drinkType}>{item.type}</Text>
      <Text style={styles.drinkTitle}>{item.title}</Text>
      <Text style={styles.drinkTime}>⏱ {item.time}</Text>
    </View>
  </TouchableOpacity>
);

const BudgetCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.budgetCard} onPress={onPress}>
    <Image source={{ uri: item.image }} style={styles.budgetImage} />
    <View style={styles.budgetContent}>
      <Text style={styles.budgetCost}>{item.cost}</Text>
      <Text style={styles.budgetTitle}>{item.title}</Text>
      <Text style={styles.budgetTime}>⏱ {item.time}</Text>
    </View>
  </TouchableOpacity>
);

const KidsCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.kidsCard} onPress={onPress}>
    <Image source={{ uri: item.image }} style={styles.kidsImage} />
    <View style={styles.kidsOverlay}>
      <Text style={styles.kidsBadge}>{item.kids}</Text>
      <Text style={styles.kidsTitle}>{item.title}</Text>
      <Text style={styles.kidsTime}>⏱ {item.time}</Text>
    </View>
  </TouchableOpacity>
);

const TipCard = ({ item }) => (
  <View style={styles.tipCard}>
    <Text style={styles.tipEmoji}>{item.emoji}</Text>
    <Text style={styles.tipText}>{item.tip}</Text>
  </View>
);

// ============== MAIN SCREEN ==============
const HomeScreen = ({ navigation }) => {
  const [ingredients, setIngredients] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      await testConnection();
    } catch (error) {
      Alert.alert('Connection Error', 'Cannot connect to backend');
    }
  };

  const handleSearch = async (searchIngredients) => {
    setLoading(true);
    setShowResults(true);
    
    try {
      const results = await searchRecipesByIngredients(searchIngredients);
      setRecipes(results);
    } catch (error) {
      Alert.alert('Error', error.message);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setShowResults(false);
    setRecipes([]);
    setIngredients('');
  };

  const handleRecipePress = (recipeId) => {
    navigation.navigate('RecipeDetail', { recipeId });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  if (loading) {
    return <DancingChefLoader message="Finding delicious recipes..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {!showResults ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          {/* Hero Search Section */}
          <GradientCard style={styles.heroCard}>
            <Text style={styles.heroTitle}>What are you craving?</Text>
            <Text style={styles.heroSubtitle}>Enter ingredients to find perfect recipes</Text>
            
            <View style={styles.heroSearchContainer}>
              <TextInput
                style={styles.heroInput}
                placeholder="e.g., chicken, rice, tomatoes..."
                placeholderTextColor={COLORS.textSecondary}
                value={ingredients}
                onChangeText={setIngredients}
                onSubmitEditing={() => handleSearch(ingredients)}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.heroButton} onPress={() => handleSearch(ingredients)}>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.heroButtonGradient}>
                  <Text style={styles.heroButtonText}>Find</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </GradientCard>

          {/* SECTION 1: Trending Now */}
          <View style={styles.section}>
            <SectionHeader title="🔥 Trending Now" subtitle="Most popular this week" />
            <FlatList
              horizontal
              data={TRENDING_NOW}
              renderItem={({ item }) => (
                <TrendingCard item={item} onPress={() => handleSearch(item.ingredients)} />
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>

          {/* SECTION 2: Quick Bites (Under 5 Minutes) */}
          <View style={styles.section}>
            <SectionHeader title="⚡ Quick Bites" subtitle="Ready in under 5 minutes" />
            <FlatList
              horizontal
              data={QUICK_BITES}
              renderItem={({ item }) => (
                <QuickBiteCard item={item} onPress={() => handleSearch(item.ingredients)} />
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>

          {/* SECTION 3: World Cuisines */}
          <View style={styles.section}>
            <SectionHeader title="🌍 World Cuisines" subtitle="Explore global flavors" seeAll={false} />
            <View style={styles.cuisineGrid}>
              {WORLD_CUISINES.map((item) => (
                <CuisineCircle key={item.id} item={item} onPress={() => handleSearch(item.ingredients)} />
              ))}
            </View>
          </View>

          {/* SECTION 4: Seasonal Spotlight */}
          <View style={styles.section}>
            <SectionHeader title="🌱 Seasonal Spotlight" subtitle="What's fresh right now" />
            <FlatList
              horizontal
              data={SEASONAL_SPOTLIGHT}
              renderItem={({ item }) => (
                <SeasonalCard item={item} onPress={() => handleSearch(item.ingredients)} />
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>

          {/* SECTION 5: Chef's Signature */}
          <View style={styles.section}>
            <SectionHeader title="👨‍🍳 Chef's Signature" subtitle="Masterchef creations" />
            <FlatList
              horizontal
              data={CHEF_SIGNATURE}
              renderItem={({ item }) => (
                <ChefCard item={item} onPress={() => handleSearch(item.ingredients)} />
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>

          {/* SECTION 6: Healthy Heroes */}
          <View style={styles.section}>
            <SectionHeader title="🥗 Healthy Heroes" subtitle="Under 500 calories" />
            <FlatList
              horizontal
              data={HEALTHY_HEROES}
              renderItem={({ item }) => (
                <HealthCard item={item} onPress={() => handleSearch(item.ingredients)} />
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>

          {/* SECTION 7: Dessert Paradise */}
          <View style={styles.section}>
            <SectionHeader title="🍰 Dessert Paradise" subtitle="Sweet indulgence" />
            <FlatList
              horizontal
              data={DESSERT_PARADISE}
              renderItem={({ item }) => (
                <DessertCard item={item} onPress={() => handleSearch(item.ingredients)} />
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>

          {/* SECTION 8: Comfort Food */}
          <View style={styles.section}>
            <SectionHeader title="😌 Comfort Food" subtitle="Warm your soul" />
            <FlatList
              horizontal
              data={COMFORT_FOOD}
              renderItem={({ item }) => (
                <ComfortCard item={item} onPress={() => handleSearch(item.ingredients)} />
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>

          {/* SECTION 9: Date Night Specials */}
          <View style={styles.section}>
            <SectionHeader title="💕 Date Night" subtitle="Impress someone special" />
            <FlatList
              horizontal
              data={DATE_NIGHT}
              renderItem={({ item }) => (
                <DateNightCard item={item} onPress={() => handleSearch(item.ingredients)} />
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>

          {/* SECTION 10: Breakfast Club */}
          <View style={styles.section}>
            <SectionHeader title="☀️ Breakfast Club" subtitle="Start your day right" />
            <FlatList
              horizontal
              data={BREAKFAST_CLUB}
              renderItem={({ item }) => (
                <BreakfastCard item={item} onPress={() => handleSearch(item.ingredients)} />
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>

          {/* SECTION 11: Vegan Vibes */}
          <View style={styles.section}>
            <SectionHeader title="🌱 Vegan Vibes" subtitle="100% plant-based" />
            <FlatList
              horizontal
              data={VEGAN_VIBES}
              renderItem={({ item }) => (
                <VeganCard item={item} onPress={() => handleSearch(item.ingredients)} />
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>

          {/* SECTION 12: Drinks & Cocktails */}
          <View style={styles.section}>
            <SectionHeader title="🍸 Drinks & Cocktails" subtitle="Raise your glass" />
            <FlatList
              horizontal
              data={DRINKS_COCKTAILS}
              renderItem={({ item }) => (
                <DrinkCard item={item} onPress={() => handleSearch(item.ingredients)} />
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>

          {/* SECTION 13: Budget Meals */}
          <View style={styles.section}>
            <SectionHeader title="💰 Budget Meals" subtitle="Delicious on a dime" />
            <FlatList
              horizontal
              data={BUDGET_MEALS}
              renderItem={({ item }) => (
                <BudgetCard item={item} onPress={() => handleSearch(item.ingredients)} />
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>

          {/* SECTION 14: Kids' Favorites */}
          <View style={styles.section}>
            <SectionHeader title="👶 Kids' Favorites" subtitle="Fun for little ones" />
            <FlatList
              horizontal
              data={KIDS_FAVORITES}
              renderItem={({ item }) => (
                <KidsCard item={item} onPress={() => handleSearch(item.ingredients)} />
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>

          {/* SECTION 15: Pro Cooking Tips */}
          <View style={styles.tipsSection}>
            <SectionHeader title="💡 Pro Cooking Tips" subtitle="Level up your skills" seeAll={false} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {COOKING_TIPS.map((item) => (
                <TipCard key={item.id} item={item} />
              ))}
            </ScrollView>
          </View>

          {/* Bottom Padding */}
          <View style={{ height: 30 }} />
        </ScrollView>
      ) : (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <View>
              <Text style={styles.resultsTitle}>
                Found <Text style={styles.resultsCount}>{recipes.length}</Text> Recipes
              </Text>
              <Text style={styles.resultsSubtitle}>for "{ingredients}"</Text>
            </View>
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕ Clear</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={recipes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <RecipeCard recipe={item} onPress={() => handleRecipePress(item.id)} />
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
                <Text style={styles.emptyText}>Try different ingredients</Text>
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
  heroCard: {
    margin: 16,
    padding: 20,
    borderRadius: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  heroSearchContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  heroInput: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
  },
  heroButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  gradientCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  trendingCard: {
    width: 260,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  trendingGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  trendingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendingBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  trendingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trendingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  trendingChef: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.9,
  },
  trendingTime: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.9,
  },
  trendingLikes: {
    color: '#fff',
    fontSize: 11,
  },
  quickBiteCard: {
    width: 180,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  quickBiteImage: {
    width: '100%',
    height: 120,
  },
  quickBiteBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quickBiteBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickBiteContent: {
    padding: 10,
  },
  quickBiteTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickBiteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickBiteTime: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  quickBiteCalories: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  cuisineCircle: {
    width: (width - 48) / 5,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  cuisineFlag: {
    fontSize: 28,
    marginBottom: 4,
  },
  cuisineName: {
    fontSize: 11,
    fontWeight: '600',
  },
  seasonalCard: {
    width: 200,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  seasonalImage: {
    width: '100%',
    height: '100%',
  },
  seasonalOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  seasonalBadge: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  seasonalBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  seasonalTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  seasonalMonth: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
  },
  chefCard: {
    width: 240,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  chefImage: {
    width: '100%',
    height: '100%',
  },
  chefGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  chefTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  chefName: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.9,
    marginBottom: 4,
  },
  chefMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  chefDifficulty: {
    color: '#fff',
    fontSize: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chefTime: {
    color: '#fff',
    fontSize: 10,
  },
  chefRating: {
    color: '#fff',
    fontSize: 10,
  },
  healthCard: {
    width: 200,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  healthImage: {
    width: '100%',
    height: 100,
  },
  healthContent: {
    padding: 10,
  },
  healthTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  healthStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthCalories: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  healthProtein: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  healthTime: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  dessertCard: {
    width: 180,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  dessertImage: {
    width: '100%',
    height: '100%',
  },
  dessertOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  dessertTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dessertMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  dessertTime: {
    color: '#fff',
    fontSize: 10,
  },
  dessertDifficulty: {
    color: '#fff',
    fontSize: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comfortCard: {
    width: 200,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  comfortImage: {
    width: '100%',
    height: '100%',
  },
  comfortOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
  },
  comfortMood: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  comfortTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  comfortTime: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
  },
  dateCard: {
    width: 220,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  dateImage: {
    width: '100%',
    height: '100%',
  },
  dateOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  dateOccasion: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dateTime: {
    color: '#fff',
    fontSize: 10,
  },
  breakfastCard: {
    width: 180,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  breakfastImage: {
    width: '100%',
    height: 100,
  },
  breakfastContent: {
    padding: 10,
  },
  breakfastType: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  breakfastTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  breakfastTime: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  veganCard: {
    width: 160,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  veganImage: {
    width: '100%',
    height: 100,
  },
  veganBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#4ade80',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  veganBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  veganTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    padding: 8,
    paddingBottom: 4,
  },
  veganTime: {
    color: COLORS.textSecondary,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  drinkCard: {
    width: 160,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  drinkImage: {
    width: '100%',
    height: 100,
  },
  drinkContent: {
    padding: 10,
  },
  drinkType: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  drinkTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  drinkTime: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  budgetCard: {
    width: 180,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  budgetImage: {
    width: '100%',
    height: 100,
  },
  budgetContent: {
    padding: 10,
  },
  budgetCost: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  budgetTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  budgetTime: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  kidsCard: {
    width: 200,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  kidsImage: {
    width: '100%',
    height: '100%',
  },
  kidsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
  },
  kidsBadge: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kidsTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  kidsTime: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
  },
  tipsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 10,
  },
  tipEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  tipText: {
    color: COLORS.text,
    fontSize: 13,
  },
  resultsContainer: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
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
  clearButton: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearButtonText: {
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
});

export default HomeScreen;
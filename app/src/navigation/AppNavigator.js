import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../constants/config';
import { Image, View, Text, TouchableOpacity } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import RecipesScreen from '../screens/RecipesScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Fun daily messages that change based on time/day
const getDailyMessage = () => {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  
  // Time-based greetings
  if (hour < 12) {
    return {
      emoji: '☀️',
      message: 'Rise & Shine! Ready to cook?',
    };
  } else if (hour < 17) {
    return {
      emoji: '⏰',
      message: 'Afternoon snack time!',
    };
  } else if (hour < 22) {
    return {
      emoji: '🌙',
      message: 'Dinner inspiration awaits',
    };
  } else {
    return {
      emoji: '🦉',
      message: 'Late night kitchen adventures',
    };
  }
};

// Random cooking quotes
const COOKING_QUOTES = [
  "👨‍🍳 Let's cook something amazing",
  "🍳 Your kitchen journey starts here",
  "🥘 Discover your next favorite meal",
  "🍝 Pasta la vista, baby!",
  "🌮 Taco 'bout delicious!",
  "🍕 Pizza my heart",
  "🥗 Eat well, live well",
  "🍣 Roll with it",
  "🍔 Bite into happiness",
  "🍦 Sweet dreams are made of this",
];

const dailyMessage = getDailyMessage();
const randomQuote = COOKING_QUOTES[Math.floor(Math.random() * COOKING_QUOTES.length)];

// Home Stack with fun header (no logo)
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { 
        backgroundColor: COLORS.background,
        height: 100,
      },
      headerTintColor: COLORS.text,
    }}
  >
    <Stack.Screen 
      name="HomeMain" 
      component={HomeScreen} 
      options={{ 
        headerTitle: () => (
          <View style={{ paddingVertical: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 24, marginRight: 8 }}>{dailyMessage.emoji}</Text>
              <Text style={{ 
                color: COLORS.primary, 
                fontSize: 16, 
                fontWeight: '600',
              }}>
                {dailyMessage.message}
              </Text>
            </View>
            <Text style={{ 
              color: COLORS.textSecondary, 
              fontSize: 13,
              fontStyle: 'italic',
            }}>
              {randomQuote}
            </Text>
          </View>
        ),
        headerTitleStyle: {
          height: 'auto',
        },
      }}
    />
    <Stack.Screen 
      name="RecipeDetail" 
      component={RecipeDetailScreen} 
      options={{ 
        title: 'Recipe Details',
        headerBackTitle: 'Back',
        headerTitleStyle: { color: COLORS.text },
      }}
    />
  </Stack.Navigator>
);

// Recipes Stack with clean header
const RecipesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.background },
      headerTintColor: COLORS.text,
    }}
  >
    <Stack.Screen 
      name="RecipesMain" 
      component={RecipesScreen} 
      options={{ 
        headerTitle: () => (
          <View>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: 'bold' }}>
              🔍 Find Recipes
            </Text>
          </View>
        ),
      }}
    />
    <Stack.Screen 
      name="RecipeDetail" 
      component={RecipeDetailScreen} 
      options={{ 
        title: 'Recipe Details',
        headerBackTitle: 'Back',
      }}
    />
  </Stack.Navigator>
);

// Categories Stack with clean header
const CategoriesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.background },
      headerTintColor: COLORS.text,
    }}
  >
    <Stack.Screen 
      name="CategoriesMain" 
      component={CategoriesScreen} 
      options={{ 
        headerTitle: () => (
          <View>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: 'bold' }}>
              🗂️ Explore Categories
            </Text>
          </View>
        ),
      }}
    />
    <Stack.Screen 
      name="RecipeDetail" 
      component={RecipeDetailScreen} 
      options={{ 
        title: 'Recipe Details',
        headerBackTitle: 'Back',
      }}
    />
  </Stack.Navigator>
);

// Settings Stack with clean header
const SettingsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.background },
      headerTintColor: COLORS.text,
    }}
  >
    <Stack.Screen 
      name="SettingsMain" 
      component={SettingsScreen} 
      options={{ 
        headerTitle: () => (
          <View>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: 'bold' }}>
              ⚙️ Settings & Preferences
            </Text>
          </View>
        ),
      }}
    />
  </Stack.Navigator>
);

// Main Tab Navigator
const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconUrl;

          if (route.name === 'Home') {
            iconUrl = focused 
              ? 'https://cdn-icons-png.flaticon.com/512/1946/1946436.png'
              : 'https://cdn-icons-png.flaticon.com/512/1946/1946488.png';
          } else if (route.name === 'Recipes') {
            iconUrl = focused
              ? 'https://cdn-icons-png.flaticon.com/512/2833/2833805.png'
              : 'https://cdn-icons-png.flaticon.com/512/2833/2833836.png';
          } else if (route.name === 'Categories') {
            iconUrl = focused
              ? 'https://cdn-icons-png.flaticon.com/512/992/992680.png'
              : 'https://cdn-icons-png.flaticon.com/512/992/992651.png';
          } else if (route.name === 'Settings') {
            iconUrl = focused
              ? 'https://cdn-icons-png.flaticon.com/512/2099/2099058.png'
              : 'https://cdn-icons-png.flaticon.com/512/2099/2099058.png';
          }

          return (
            <Image 
              source={{ uri: iconUrl }} 
              style={{
                width: 24,
                height: 24,
                tintColor: color,
              }}
              resizeMode="contain"
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Recipes" component={RecipesStack} />
      <Tab.Screen name="Categories" component={CategoriesStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
};

export default AppNavigator;
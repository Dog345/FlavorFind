import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
  Image,
  Animated,
  Dimensions, // ← MAKE SURE THIS IS HERE
  Modal,
} from 'react-native';
import { COLORS } from '../constants/config';
import { searchRecipesByIngredients } from '../services/api';
import RecipeCard from '../components/RecipeCard';
import DancingChefLoader from '../components/DancingChefLoader';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// ============== COMING SOON MODAL ==============
const ComingSoonModal = ({ visible, onClose, categoryName }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const bounceValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Spinning animation for the chef hat
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();

      // Bouncing animation for the food emojis
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceValue, {
            toValue: -15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Fading animation for sparkles
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeValue, {
            toValue: 0.2,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      spinValue.setValue(0);
      bounceValue.setValue(0);
      fadeValue.setValue(0);
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
            colors={['#e87a3d', '#b55d2f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalContent}
          >
            {/* Animated Elements */}
            <View style={styles.modalAnimations}>
              <Animated.Text style={[styles.modalEmoji, { transform: [{ rotate: spin }] }]}>
                👨‍🍳
              </Animated.Text>
              <Animated.Text style={[styles.modalEmoji, { transform: [{ translateY: bounceValue }] }]}>
                🍳
              </Animated.Text>
              <Animated.Text style={[styles.modalEmoji, { opacity: fadeValue }]}>
                ✨
              </Animated.Text>
            </View>

            <Text style={styles.modalTitle}>Coming Soon!</Text>
            <Text style={styles.modalSubtitle}>{categoryName}</Text>
            
            <View style={styles.modalDivider} />
            
            <Text style={styles.modalDescription}>
              We're working with local chefs to bring you authentic recipes from this region.
            </Text>

            <View style={styles.modalFeatures}>
              <View style={styles.modalFeature}>
                <Text style={styles.featureEmoji}>👩‍🍳</Text>
                <Text style={styles.featureText}>Traditional recipes</Text>
              </View>
              <View style={styles.modalFeature}>
                <Text style={styles.featureEmoji}>📖</Text>
                <Text style={styles.featureText}>Cultural stories</Text>
              </View>
              <View style={styles.modalFeature}>
                <Text style={styles.featureEmoji}>🎥</Text>
                <Text style={styles.featureText}>Cooking videos</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>Notify Me When Ready</Text>
            </TouchableOpacity>

            <Text style={styles.modalFooter}>We'll notify you as soon as it's available!</Text>
          </LinearGradient>
        </View>
      </BlurView>
    </Modal>
  );
};

// ============== CATEGORY DATABASE ==============
const CATEGORIES = [
  {
    id: 'africa',
    name: '🌍 African Cuisine',
    icon: '🌍',
    type: 'continent',
    gradient: ['#e87a3d', '#b55d2f'],
    isAvailable: true,
    children: [
      {
        id: 'east-africa',
        name: '🌅 East Africa',
        icon: '🌅',
        type: 'region',
        gradient: ['#e8a63d', '#b57f2f'],
        isAvailable: true,
        children: [
          {
            id: 'kenya',
            name: '🇰🇪 Kenya',
            icon: '🇰🇪',
            flag: '🇰🇪',
            type: 'country',
            gradient: ['#4ade80', '#2d9e5a'],
            isAvailable: true,
            ingredients: 'maize,beans,potatoes,greens,meat,rice,coconut',
            description: 'From Nyama Choma to Ugali',
            tribes: ['Kikuyu', 'Luo', 'Kalenjin', 'Kamba', 'Luhya', 'Maasai'],
            recipeCount: '450+',
          },
          {
            id: 'tanzania',
            name: '🇹🇿 Tanzania',
            icon: '🇹🇿',
            flag: '🇹🇿',
            type: 'country',
            gradient: ['#3d9ee8', '#2d6fa3'],
            isAvailable: true,
            ingredients: 'rice,fish,coconut,plantains,beans,spices',
            description: 'Zanzibar spices and coastal flavors',
            tribes: ['Sukuma', 'Chaga', 'Nyamwezi', 'Maasai', 'Haya'],
            recipeCount: '380+',
          },
          {
            id: 'uganda',
            name: '🇺🇬 Uganda',
            icon: '🇺🇬',
            flag: '🇺🇬',
            type: 'country',
            gradient: ['#e8e83d', '#c9b02a'],
            isAvailable: true,
            ingredients: 'plantains,peanuts,beans,fish,greens,matoke',
            description: 'Matoke and groundnut stew',
            tribes: ['Baganda', 'Banyankole', 'Basoga', 'Bakiga', 'Iteso'],
            recipeCount: '320+',
          },
          {
            id: 'rwanda',
            name: '🇷🇼 Rwanda',
            icon: '🇷🇼',
            flag: '🇷🇼',
            type: 'country',
            gradient: ['#3d9ee8', '#2d6fa3'],
            isAvailable: true,
            ingredients: 'beans,plantains,potatoes,greens,goat meat',
            description: 'Brochettes and Isombe',
            tribes: ['Hutu', 'Tutsi', 'Twa'],
            recipeCount: '280+',
          },
          {
            id: 'burundi',
            name: '🇧🇮 Burundi',
            icon: '🇧🇮',
            flag: '🇧🇮',
            type: 'country',
            gradient: ['#e83d3d', '#b02f2f'],
            isAvailable: false,
            description: 'Coming soon - Traditional Burundian cuisine',
          },
          {
            id: 'ethiopia',
            name: '🇪🇹 Ethiopia',
            icon: '🇪🇹',
            flag: '🇪🇹',
            type: 'country',
            gradient: ['#e8a63d', '#b57f2f'],
            isAvailable: true,
            ingredients: 'teff flour,chicken,eggs,spices,lentils,onions',
            description: 'Injera, Doro Wat, and coffee ceremony',
            tribes: ['Oromo', 'Amhara', 'Tigray', 'Somali'],
            recipeCount: '520+',
          },
          {
            id: 'somalia',
            name: '🇸🇴 Somalia',
            icon: '🇸🇴',
            flag: '🇸🇴',
            type: 'country',
            gradient: ['#3d9ee8', '#2d6fa3'],
            isAvailable: false,
            description: 'Coming soon - Somali cuisine',
          },
          {
            id: 'south-sudan',
            name: '🇸🇸 South Sudan',
            icon: '🇸🇸',
            flag: '🇸🇸',
            type: 'country',
            gradient: ['#4ade80', '#2d9e5a'],
            isAvailable: false,
            description: 'Coming soon - South Sudanese cuisine',
          },
          {
            id: 'djibouti',
            name: '🇩🇯 Djibouti',
            icon: '🇩🇯',
            flag: '🇩🇯',
            type: 'country',
            gradient: ['#e87a3d', '#b55d2f'],
            isAvailable: false,
            description: 'Coming soon - Djiboutian cuisine',
          },
          {
            id: 'eritrea',
            name: '🇪🇷 Eritrea',
            icon: '🇪🇷',
            flag: '🇪🇷',
            type: 'country',
            gradient: ['#e83d8c', '#b02f6f'],
            isAvailable: false,
            description: 'Coming soon - Eritrean cuisine',
          },
        ],
      },
      {
        id: 'west-africa',
        name: '🌄 West Africa',
        icon: '🌄',
        type: 'region',
        gradient: ['#e8a63d', '#b57f2f'],
        isAvailable: true,
        children: [
          {
            id: 'nigeria',
            name: '🇳🇬 Nigeria',
            icon: '🇳🇬',
            flag: '🇳🇬',
            type: 'country',
            gradient: ['#4ade80', '#2d9e5a'],
            isAvailable: true,
            ingredients: 'rice,beans,yams,plantains,peppers,palm oil',
            description: 'Jollof rice, Egusi soup, and Suya',
            tribes: ['Hausa', 'Yoruba', 'Igbo', 'Fulani', 'Ijaw'],
            recipeCount: '680+',
          },
          {
            id: 'ghana',
            name: '🇬🇭 Ghana',
            icon: '🇬🇭',
            flag: '🇬🇭',
            type: 'country',
            gradient: ['#e8e83d', '#c9b02a'],
            isAvailable: true,
            ingredients: 'cassava,plantains,cocoa,tomatoes,peanuts',
            description: 'Fufu, Banku, and Kelewele',
            tribes: ['Akan', 'Mole-Dagbon', 'Ewe', 'Ga-Dangme'],
            recipeCount: '420+',
          },
          {
            id: 'senegal',
            name: '🇸🇳 Senegal',
            icon: '🇸🇳',
            flag: '🇸🇳',
            type: 'country',
            gradient: ['#e83d3d', '#b02f2f'],
            isAvailable: true,
            ingredients: 'fish,rice,peanuts,onions,lemons',
            description: 'Thieboudienne (national dish)',
            tribes: ['Wolof', 'Fula', 'Serer', 'Jola'],
            recipeCount: '310+',
          },
          {
            id: 'cote-ivoire',
            name: '🇨🇮 Côte d\'Ivoire',
            icon: '🇨🇮',
            flag: '🇨🇮',
            type: 'country',
            gradient: ['#e87a3d', '#b55d2f'],
            isAvailable: false,
            description: 'Coming soon - Ivorian cuisine',
          },
          {
            id: 'mali',
            name: '🇲🇱 Mali',
            icon: '🇲🇱',
            flag: '🇲🇱',
            type: 'country',
            gradient: ['#e8a63d', '#b57f2f'],
            isAvailable: false,
            description: 'Coming soon - Malian cuisine',
          },
        ],
      },
      {
        id: 'north-africa',
        name: '🏜️ North Africa',
        icon: '🏜️',
        type: 'region',
        gradient: ['#e83d3d', '#b02f2f'],
        isAvailable: true,
        children: [
          {
            id: 'morocco',
            name: '🇲🇦 Morocco',
            icon: '🇲🇦',
            flag: '🇲🇦',
            type: 'country',
            gradient: ['#e87a3d', '#b55d2f'],
            isAvailable: true,
            ingredients: 'couscous,lamb,dates,almonds,spices,olives',
            description: 'Tagine, Couscous, and Mint Tea',
            tribes: ['Arabs', 'Berbers', 'Saharawi'],
            recipeCount: '580+',
          },
          {
            id: 'egypt',
            name: '🇪🇬 Egypt',
            icon: '🇪🇬',
            flag: '🇪🇬',
            type: 'country',
            gradient: ['#e8e83d', '#c9b02a'],
            isAvailable: true,
            ingredients: 'beans,rice,bread,vegetables,garlic,lemons',
            description: 'Koshari, Ful Medames, and Hawawshi',
            tribes: ['Egyptians', 'Bedouins', 'Nubians'],
            recipeCount: '490+',
          },
          {
            id: 'algeria',
            name: '🇩🇿 Algeria',
            icon: '🇩🇿',
            flag: '🇩🇿',
            type: 'country',
            gradient: ['#4ade80', '#2d9e5a'],
            isAvailable: false,
            description: 'Coming soon - Algerian cuisine',
          },
          {
            id: 'tunisia',
            name: '🇹🇳 Tunisia',
            icon: '🇹🇳',
            flag: '🇹🇳',
            type: 'country',
            gradient: ['#e83d8c', '#b02f6f'],
            isAvailable: false,
            description: 'Coming soon - Tunisian cuisine',
          },
          {
            id: 'libya',
            name: '🇱🇾 Libya',
            icon: '🇱🇾',
            flag: '🇱🇾',
            type: 'country',
            gradient: ['#3d9ee8', '#2d6fa3'],
            isAvailable: false,
            description: 'Coming soon - Libyan cuisine',
          },
        ],
      },
      {
        id: 'southern-africa',
        name: '🏔️ Southern Africa',
        icon: '🏔️',
        type: 'region',
        gradient: ['#3d9ee8', '#2d6fa3'],
        isAvailable: true,
        children: [
          {
            id: 'south-africa',
            name: '🇿🇦 South Africa',
            icon: '🇿🇦',
            flag: '🇿🇦',
            type: 'country',
            gradient: ['#e8a63d', '#b57f2f'],
            isAvailable: true,
            ingredients: 'maize,meat,potatoes,vegetables,spices',
            description: 'Braai, Bobotie, and Bunny Chow',
            tribes: ['Zulu', 'Xhosa', 'Afrikaner', 'Sotho', 'Tswana'],
            recipeCount: '620+',
          },
          {
            id: 'zimbabwe',
            name: '🇿🇼 Zimbabwe',
            icon: '🇿🇼',
            flag: '🇿🇼',
            type: 'country',
            gradient: ['#e87a3d', '#b55d2f'],
            isAvailable: false,
            description: 'Coming soon - Zimbabwean cuisine',
          },
          {
            id: 'zambia',
            name: '🇿🇲 Zambia',
            icon: '🇿🇲',
            flag: '🇿🇲',
            type: 'country',
            gradient: ['#4ade80', '#2d9e5a'],
            isAvailable: false,
            description: 'Coming soon - Zambian cuisine',
          },
          {
            id: 'mozambique',
            name: '🇲🇿 Mozambique',
            icon: '🇲🇿',
            flag: '🇲🇿',
            type: 'country',
            gradient: ['#e83d3d', '#b02f2f'],
            isAvailable: false,
            description: 'Coming soon - Mozambican cuisine',
          },
          {
            id: 'angola',
            name: '🇦🇴 Angola',
            icon: '🇦🇴',
            flag: '🇦🇴',
            type: 'country',
            gradient: ['#e8e83d', '#c9b02a'],
            isAvailable: false,
            description: 'Coming soon - Angolan cuisine',
          },
          {
            id: 'namibia',
            name: '🇳🇦 Namibia',
            icon: '🇳🇦',
            flag: '🇳🇦',
            type: 'country',
            gradient: ['#3d9ee8', '#2d6fa3'],
            isAvailable: false,
            description: 'Coming soon - Namibian cuisine',
          },
        ],
      },
      {
        id: 'central-africa',
        name: '🌴 Central Africa',
        icon: '🌴',
        type: 'region',
        gradient: ['#4ade80', '#2d9e5a'],
        isAvailable: true,
        children: [
          {
            id: 'cameroon',
            name: '🇨🇲 Cameroon',
            icon: '🇨🇲',
            flag: '🇨🇲',
            type: 'country',
            gradient: ['#e87a3d', '#b55d2f'],
            isAvailable: false,
            description: 'Coming soon - Cameroonian cuisine',
          },
          {
            id: 'drc',
            name: '🇨🇩 DR Congo',
            icon: '🇨🇩',
            flag: '🇨🇩',
            type: 'country',
            gradient: ['#e83d3d', '#b02f2f'],
            isAvailable: false,
            description: 'Coming soon - Congolese cuisine',
          },
          {
            id: 'gabon',
            name: '🇬🇦 Gabon',
            icon: '🇬🇦',
            flag: '🇬🇦',
            type: 'country',
            gradient: ['#e8a63d', '#b57f2f'],
            isAvailable: false,
            description: 'Coming soon - Gabonese cuisine',
          },
        ],
      },
    ],
  },
  {
    id: 'asia',
    name: '🍜 Asian Cuisine',
    icon: '🍜',
    type: 'continent',
    gradient: ['#e83d8c', '#b02f6f'],
    isAvailable: true,
    children: [
      {
        id: 'east-asia',
        name: '🗾 East Asia',
        icon: '🗾',
        type: 'region',
        gradient: ['#e83d8c', '#b02f6f'],
        isAvailable: true,
        children: [
          {
            id: 'japan',
            name: '🇯🇵 Japan',
            icon: '🇯🇵',
            flag: '🇯🇵',
            type: 'country',
            gradient: ['#e83d8c', '#b02f6f'],
            isAvailable: true,
            ingredients: 'rice,fish,soy sauce,seaweed,tofu',
            description: 'Sushi, Ramen, and Izakaya',
            recipeCount: '2.1k+',
          },
          {
            id: 'china',
            name: '🇨🇳 China',
            icon: '🇨🇳',
            flag: '🇨🇳',
            type: 'country',
            gradient: ['#e83d3d', '#b02f2f'],
            isAvailable: true,
            ingredients: 'rice,noodles,soy sauce,ginger,garlic',
            description: 'Dim Sum, Peking Duck, and Stir-fry',
            recipeCount: '3.2k+',
          },
          {
            id: 'korea',
            name: '🇰🇷 Korea',
            icon: '🇰🇷',
            flag: '🇰🇷',
            type: 'country',
            gradient: ['#e87a3d', '#b55d2f'],
            isAvailable: true,
            ingredients: 'rice,gochujang,tofu,vegetables,beef',
            description: 'Kimchi, Bibimbap, and Korean BBQ',
            recipeCount: '1.8k+',
          },
        ],
      },
    ],
  },
  {
    id: 'europe',
    name: '🍝 European Cuisine',
    icon: '🍝',
    type: 'continent',
    gradient: ['#3d9ee8', '#2d6fa3'],
    isAvailable: true,
    children: [
      {
        id: 'southern-europe',
        name: '☀️ Southern Europe',
        icon: '☀️',
        type: 'region',
        gradient: ['#e87a3d', '#b55d2f'],
        isAvailable: true,
        children: [
          {
            id: 'italy',
            name: '🇮🇹 Italy',
            icon: '🇮🇹',
            flag: '🇮🇹',
            type: 'country',
            gradient: ['#e87a3d', '#b55d2f'],
            isAvailable: true,
            ingredients: 'pasta,tomato,cheese,olive oil,basil',
            description: 'Pizza, Pasta, and Gelato',
            recipeCount: '2.5k+',
          },
          {
            id: 'spain',
            name: '🇪🇸 Spain',
            icon: '🇪🇸',
            flag: '🇪🇸',
            type: 'country',
            gradient: ['#e83d3d', '#b02f2f'],
            isAvailable: true,
            ingredients: 'rice,seafood,saffron,olives,garlic',
            description: 'Paella, Tapas, and Churros',
            recipeCount: '1.6k+',
          },
        ],
      },
    ],
  },
  {
    id: 'americas',
    name: '🌎 Americas',
    icon: '🌎',
    type: 'continent',
    gradient: ['#4ade80', '#2d9e5a'],
    isAvailable: true,
    children: [
      {
        id: 'north-america',
        name: '🍔 North America',
        icon: '🍔',
        type: 'region',
        gradient: ['#e83d3d', '#b02f2f'],
        isAvailable: true,
        children: [
          {
            id: 'usa',
            name: '🇺🇸 USA',
            icon: '🇺🇸',
            flag: '🇺🇸',
            type: 'country',
            gradient: ['#e83d3d', '#b02f2f'],
            isAvailable: true,
            ingredients: 'beef,chicken,potatoes,cheese,wheat',
            description: 'Burgers, BBQ, and Soul Food',
            recipeCount: '3.5k+',
          },
          {
            id: 'mexico',
            name: '🇲🇽 Mexico',
            icon: '🇲🇽',
            flag: '🇲🇽',
            type: 'country',
            gradient: ['#e87a3d', '#b55d2f'],
            isAvailable: true,
            ingredients: 'beans,rice,avocado,tortilla,chili',
            description: 'Tacos, Enchiladas, and Guacamole',
            recipeCount: '2.1k+',
          },
        ],
      },
    ],
  },
];

// ============== COMPONENTS ==============

const CategoryCard = ({ item, level = 0, onPress, onComingSoon }) => {
  const [expanded, setExpanded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePress = () => {
    if (item.isAvailable) {
      if (item.children) {
        setExpanded(!expanded);
      } else {
        onPress(item);
      }
    } else {
      onComingSoon(item);
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.categoryCard,
              { marginLeft: level * 20 },
            ]}
          >
            <View style={styles.categoryContent}>
              <View style={styles.categoryLeft}>
                <Text style={styles.categoryIcon}>{item.icon || item.flag}</Text>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.categoryDescription}>{item.description}</Text>
                  )}
                  {item.recipeCount && (
                    <View style={styles.categoryStats}>
                      <Text style={styles.categoryStat}>📊 {item.recipeCount} recipes</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.categoryRight}>
                {!item.isAvailable && (
                  <View style={styles.comingSoonTag}>
                    <Text style={styles.comingSoonTagText}>Soon</Text>
                  </View>
                )}
                {item.children && (
                  <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
                )}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {expanded && item.children && (
        <View style={styles.childrenContainer}>
          {item.children.map((child) => (
            <CategoryCard
              key={child.id}
              item={child}
              level={level + 1}
              onPress={onPress}
              onComingSoon={onComingSoon}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const FeaturedTribes = ({ tribes, onTribePress }) => {
  if (!tribes || tribes.length === 0) return null;

  return (
    <View style={styles.tribesSection}>
      <Text style={styles.tribesTitle}>👥 Featured Tribes</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tribesContainer}>
          {tribes.map((tribe, index) => (
            <TouchableOpacity
              key={index}
              style={styles.tribeItem}
              onPress={() => onTribePress(tribe)}
            >
              <Text style={styles.tribeEmoji}>👨‍🍳</Text>
              <Text style={styles.tribeName}>{tribe}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const HeroBanner = () => (
  <LinearGradient
    colors={['#e87a3d', '#b55d2f']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.heroBanner}
  >
    <View style={styles.heroContent}>
      <Text style={styles.heroEmoji}>🌍</Text>
      <View style={styles.heroText}>
        <Text style={styles.heroTitle}>Explore African Cuisine</Text>
        <Text style={styles.heroSubtitle}>50+ countries • 200+ tribes • 1000+ recipes</Text>
      </View>
    </View>
    <View style={styles.heroBadges}>
      <View style={styles.heroBadge}>
        <Text style={styles.heroBadgeText}>🇰🇪</Text>
      </View>
      <View style={styles.heroBadge}>
        <Text style={styles.heroBadgeText}>🇳🇬</Text>
      </View>
      <View style={styles.heroBadge}>
        <Text style={styles.heroBadgeText}>🇿🇦</Text>
      </View>
      <View style={styles.heroBadge}>
        <Text style={styles.heroBadgeText}>🇪🇹</Text>
      </View>
    </View>
  </LinearGradient>
);

// ============== MAIN SCREEN ==============
const CategoriesScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [comingSoonVisible, setComingSoonVisible] = useState(false);
  const [selectedComingSoon, setSelectedComingSoon] = useState(null);

  const handleCategoryPress = async (category) => {
    if (!category.ingredients) {
      // If it's a category without ingredients (region/continent), just expand
      return;
    }

    setSelectedCategory(category);
    setLoading(true);
    setShowResults(true);
    
    try {
      const results = await searchRecipesByIngredients(category.ingredients);
      setRecipes(results);
    } catch (error) {
      Alert.alert('Error', `Failed to load ${category.name} recipes`);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleComingSoon = (category) => {
    setSelectedComingSoon(category);
    setComingSoonVisible(true);
  };

  const handleRecipePress = (recipeId) => {
    navigation.navigate('RecipeDetail', { recipeId });
  };

  const handleTribePress = (tribe) => {
    Alert.alert(
      'Tribal Cuisine',
      `Traditional ${tribe} recipes coming soon! We're working with ${tribe} elders to document authentic dishes.`,
      [{ text: 'Can\'t wait!', style: 'default' }]
    );
  };

  const clearSearch = () => {
    setShowResults(false);
    setRecipes([]);
    setSelectedCategory(null);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  if (loading) {
    return <DancingChefLoader message={`Loading ${selectedCategory?.name} recipes...`} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ComingSoonModal
        visible={comingSoonVisible}
        onClose={() => setComingSoonVisible(false)}
        categoryName={selectedComingSoon?.name}
      />

      {!showResults ? (
        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CategoryCard
              item={item}
              onPress={handleCategoryPress}
              onComingSoon={handleComingSoon}
            />
          )}
          ListHeaderComponent={
            <View>
              <HeroBanner />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>🍽️ Culinary Journey</Text>
                <Text style={styles.headerSubtitle}>
                  Explore by continent, region, or tribe
                </Text>
              </View>
            </View>
          }
          ListFooterComponent={<View style={{ height: 20 }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      ) : (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <View>
              <Text style={styles.resultsTitle}>
                {selectedCategory?.name} Recipes
              </Text>
              <Text style={styles.resultsCount}>
                Found {recipes.length} recipes
              </Text>
              {selectedCategory?.tribes && (
                <FeaturedTribes 
                  tribes={selectedCategory.tribes} 
                  onTribePress={handleTribePress}
                />
              )}
            </View>
            <TouchableOpacity onPress={clearSearch} style={styles.resultsClearButton}>
              <Text style={styles.resultsClearText}>← Back</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={recipes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <RecipeCard 
                recipe={item} 
                onPress={() => handleRecipePress(item.id)}
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
                  Try another category
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
  heroBanner: {
    margin: 16,
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 16,
  },
  headerText: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  categoryCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  categoryDescription: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.8,
    marginBottom: 4,
  },
  categoryStats: {
    flexDirection: 'row',
  },
  categoryStat: {
    color: '#fff',
    fontSize: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comingSoonTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  expandIcon: {
    color: '#fff',
    fontSize: 14,
  },
  childrenContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  tribesSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  tribesTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tribesContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  tribeItem: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tribeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  tribeName: {
    color: COLORS.text,
    fontSize: 13,
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  resultsTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultsCount: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8,
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
    width: 48,
    height: 48,
    marginBottom: 16,
    tintColor: COLORS.textSecondary,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
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
  modalAnimations: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  modalEmoji: {
    fontSize: 40,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDivider: {
    width: 60,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginBottom: 16,
  },
  modalDescription: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
    lineHeight: 20,
  },
  modalFeatures: {
    width: '100%',
    marginBottom: 20,
  },
  modalFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 10,
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  featureText: {
    color: '#fff',
    fontSize: 13,
  },
  modalButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#e87a3d',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalFooter: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontStyle: 'italic',
  },
});

export default CategoriesScreen;
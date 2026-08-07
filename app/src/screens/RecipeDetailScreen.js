import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
  Animated,
  Dimensions, // ← MAKE SURE THIS IS HERE
  Share,
  StatusBar,
} from 'react-native';
import { COLORS } from '../constants/config';
import { getRecipeDetails } from '../services/api';
import DancingChefLoader from '../components/DancingChefLoader';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');

const RecipeDetailScreen = ({ route, navigation }) => {
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ingredients'); // 'ingredients' or 'instructions'
  const [servings, setServings] = useState(2);
  const [nutrition, setNutrition] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [timer, setTimer] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [1.2, 1, 0.8],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadRecipeDetails();
  }, []);

  const loadRecipeDetails = async () => {
    try {
      const data = await getRecipeDetails(recipeId);
      setRecipe(data);
      
      // Simulate nutrition data (in real app, this would come from API)
      setNutrition({
        calories: Math.floor(Math.random() * 500) + 300,
        protein: Math.floor(Math.random() * 30) + 10,
        carbs: Math.floor(Math.random() * 50) + 20,
        fat: Math.floor(Math.random() * 20) + 5,
        fiber: Math.floor(Math.random() * 10) + 2,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load recipe details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing recipe: ${recipe.title}\n\n${recipe.sourceUrl}`,
        title: recipe.title,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share recipe');
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    Alert.alert(
      isSaved ? 'Removed from Saved' : 'Recipe Saved',
      isSaved ? 'Recipe removed from your collection' : 'Recipe added to your saved recipes'
    );
  };

  const handleStartTimer = (minutes) => {
    const seconds = minutes * 60;
    setTimer(seconds);
    setIsTimerRunning(true);
    
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          Alert.alert('Timer Done!', 'Your cooking time is complete!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const adjustServings = (amount) => {
    setServings(Math.max(1, servings + amount));
  };

  const getIngredientAmount = (original) => {
    // Simple scaling logic - in production, you'd parse the ingredient properly
    const match = original.match(/^([\d.]+)/);
    if (match && servings !== 2) {
      const num = parseFloat(match[0]);
      const scaled = (num * servings) / 2;
      return original.replace(/^[\d.]+/, scaled.toFixed(1));
    }
    return original;
  };

  if (loading) {
    return <DancingChefLoader message="Preparing your recipe..." />;
  }

  if (!recipe) {
    return null;
  }

  const cookingTime = recipe.readyInMinutes || recipe.cookingMinutes || 30;
  const servings_count = recipe.servings || 4;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Animated Header Image */}
      <Animated.View style={[styles.imageContainer, { transform: [{ scale: imageScale }] }]}>
        <Image 
          source={{ uri: recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }} 
          style={styles.image}
        />
        <LinearGradient
          colors={['transparent', COLORS.background]}
          style={styles.imageGradient}
          locations={[0.5, 1]}
        />
      </Animated.View>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <BlurView intensity={80} tint="dark" style={styles.backButtonBlur}>
          <Text style={styles.backButtonText}>←</Text>
        </BlurView>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <BlurView intensity={80} tint="dark" style={styles.actionButtonBlur}>
            <Text style={styles.actionButtonIcon}>📤</Text>
          </BlurView>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
          <BlurView intensity={80} tint="dark" style={styles.actionButtonBlur}>
            <Text style={styles.actionButtonIcon}>{isSaved ? '❤️' : '🤍'}</Text>
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{recipe.title}</Text>
          
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>⏱️</Text>
              <Text style={styles.statValue}>{cookingTime} min</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>👥</Text>
              <Text style={styles.statValue}>{servings_count} servings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>📊</Text>
              <Text style={styles.statValue}>
                {recipe.difficulty || 'Medium'}
              </Text>
            </View>
          </View>

          {/* Timer Button */}
          {cookingTime > 0 && (
            <TouchableOpacity 
              style={styles.timerButton}
              onPress={() => handleStartTimer(cookingTime)}
              disabled={isTimerRunning}
            >
              <LinearGradient
                colors={isTimerRunning ? ['#9ca3af', '#6b7280'] : [COLORS.primary, COLORS.primaryDark]}
                style={styles.timerGradient}
              >
                <Text style={styles.timerEmoji}>⏲️</Text>
                <Text style={styles.timerText}>
                  {isTimerRunning 
                    ? `Cooking: ${formatTime(timer)}` 
                    : `Start ${cookingTime} min Timer`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Nutrition Facts */}
        {nutrition && (
          <View style={styles.nutritionSection}>
            <Text style={styles.sectionTitle}>📊 Nutrition Facts</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition.fat}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition.fiber}g</Text>
                <Text style={styles.nutritionLabel}>Fiber</Text>
              </View>
            </View>
          </View>
        )}

        {/* Serving Adjuster */}
        <View style={styles.servingAdjuster}>
          <Text style={styles.servingLabel}>Servings:</Text>
          <View style={styles.servingControls}>
            <TouchableOpacity 
              style={styles.servingButton}
              onPress={() => adjustServings(-1)}
            >
              <Text style={styles.servingButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.servingCount}>{servings}</Text>
            <TouchableOpacity 
              style={styles.servingButton}
              onPress={() => adjustServings(1)}
            >
              <Text style={styles.servingButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ingredients' && styles.activeTab]}
            onPress={() => setActiveTab('ingredients')}
          >
            <Text style={[styles.tabText, activeTab === 'ingredients' && styles.activeTabText]}>
              🥕 Ingredients
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'instructions' && styles.activeTab]}
            onPress={() => setActiveTab('instructions')}
          >
            <Text style={[styles.tabText, activeTab === 'instructions' && styles.activeTabText]}>
              📝 Instructions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ingredients Tab */}
        {activeTab === 'ingredients' && (
          <View style={styles.ingredientsContainer}>
            {recipe.extendedIngredients && recipe.extendedIngredients.map((ingredient, index) => (
              <Animated.View 
                key={index} 
                style={[
                  styles.ingredientItem,
                  { animationDelay: `${index * 50}ms` }
                ]}
              >
                <View style={styles.ingredientBullet}>
                  <Text style={styles.ingredientBulletText}>•</Text>
                </View>
                <Text style={styles.ingredientText}>
                  {getIngredientAmount(ingredient.original)}
                </Text>
                <TouchableOpacity style={styles.ingredientCheck}>
                  <Text style={styles.ingredientCheckText}>✓</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
            
            {/* Tips Section */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
              <View style={styles.tipCard}>
                <Text style={styles.tipEmoji}>🔪</Text>
                <Text style={styles.tipText}>
                  Have all ingredients at room temperature for best results
                </Text>
              </View>
              <View style={styles.tipCard}>
                <Text style={styles.tipEmoji}>🧂</Text>
                <Text style={styles.tipText}>
                  Season as you go, not just at the end
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Instructions Tab */}
        {activeTab === 'instructions' && (
          <View style={styles.instructionsContainer}>
            {recipe.analyzedInstructions && recipe.analyzedInstructions[0] ? (
              recipe.analyzedInstructions[0].steps.map((step, index) => (
                <Animated.View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      style={styles.stepNumberGradient}
                    >
                      <Text style={styles.stepNumberText}>{step.number}</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepText}>{step.step}</Text>
                    
                    {/* Step Timer (if applicable) */}
                    {step.length && step.length.number > 0 && (
                      <TouchableOpacity 
                        style={styles.stepTimer}
                        onPress={() => handleStartTimer(step.length.number)}
                      >
                        <Text style={styles.stepTimerEmoji}>⏱️</Text>
                        <Text style={styles.stepTimerText}>
                          {step.length.number} min
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Animated.View>
              ))
            ) : (
              <View style={styles.noInstructions}>
                <Text style={styles.noInstructionsEmoji}>📖</Text>
                <Text style={styles.noInstructionsTitle}>No instructions available</Text>
                <Text style={styles.noInstructionsText}>
                  Please visit the source website for detailed instructions
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Source Button */}
        {recipe.sourceUrl && (
          <TouchableOpacity 
            style={styles.sourceButton}
            onPress={() => Linking.openURL(recipe.sourceUrl)}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.sourceGradient}
            >
              <Text style={styles.sourceEmoji}>🌐</Text>
              <Text style={styles.sourceText}>
                View Full Recipe on {recipe.sourceName || 'Source Website'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    borderRadius: 25,
    overflow: 'hidden',
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionButtons: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  actionButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
    marginTop: height * 0.3,
    zIndex: 2,
  },
  titleSection: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    lineHeight: 34,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  timerButton: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  timerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 10,
  },
  timerEmoji: {
    fontSize: 20,
  },
  timerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nutritionSection: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '18%',
    alignItems: 'center',
  },
  nutritionValue: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nutritionLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  servingAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 20,
  },
  servingLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  servingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  servingCount: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  ingredientsContainer: {
    paddingHorizontal: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginBottom: 8,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ingredientBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ingredientBulletText: {
    color: '#fff',
    fontSize: 16,
  },
  ingredientText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  ingredientCheck: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ingredientCheckText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  tipsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginBottom: 8,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  instructionsContainer: {
    paddingHorizontal: 20,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepNumber: {
    marginRight: 15,
  },
  stepNumberGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  stepTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232,122,61,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  stepTimerEmoji: {
    fontSize: 14,
    marginRight: 5,
  },
  stepTimerText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  noInstructions: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: COLORS.card,
    borderRadius: 20,
  },
  noInstructionsEmoji: {
    fontSize: 50,
    marginBottom: 15,
  },
  noInstructionsTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noInstructionsText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  sourceButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  sourceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  sourceEmoji: {
    fontSize: 18,
  },
  sourceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RecipeDetailScreen;
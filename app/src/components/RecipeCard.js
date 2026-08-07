import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../constants/config';

const RecipeCard = ({ recipe, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image 
        source={{ uri: recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }} 
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
        
        {/* Used Ingredients */}
        {recipe.usedIngredients && recipe.usedIngredients.length > 0 && (
          <View style={styles.ingredientsContainer}>
            <Text style={styles.ingredientsLabel}>You have:</Text>
            <View style={styles.ingredientsList}>
              {recipe.usedIngredients.slice(0, 2).map((ing, index) => (
                <View key={index} style={[styles.ingredientTag, styles.usedIngredient]}>
                  <Text style={styles.usedIngredientText}>{ing.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Missing Ingredients */}
        {recipe.missedIngredients && recipe.missedIngredients.length > 0 && (
          <View style={styles.ingredientsContainer}>
            <Text style={styles.ingredientsLabel}>Missing:</Text>
            <View style={styles.ingredientsList}>
              {recipe.missedIngredients.slice(0, 2).map((ing, index) => (
                <View key={index} style={[styles.ingredientTag, styles.missingIngredient]}>
                  <Text style={styles.missingIngredientText}>{ing.name}</Text>
                </View>
              ))}
              {recipe.missedIngredients.length > 2 && (
                <Text style={styles.moreText}>+{recipe.missedIngredients.length - 2} more</Text>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    flexDirection: 'row',
    height: 120,
  },
  image: {
    width: 100,
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  ingredientsContainer: {
    marginBottom: 4,
  },
  ingredientsLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginBottom: 2,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  ingredientTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 2,
  },
  usedIngredient: {
    backgroundColor: '#1a4731',
  },
  usedIngredientText: {
    color: '#4ade80',
    fontSize: 9,
  },
  missingIngredient: {
    backgroundColor: '#2d2d2d',
  },
  missingIngredientText: {
    color: COLORS.textSecondary,
    fontSize: 9,
  },
  moreText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    marginLeft: 2,
  },
});

export default RecipeCard;
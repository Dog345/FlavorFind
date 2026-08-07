import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { COLORS } from '../constants/config';

const RecipeCardSkeleton = () => {
  return (
    <View style={styles.card}>
      <SkeletonLoader width={100} height={120} borderRadius={12} />
      <View style={styles.content}>
        <SkeletonLoader width="80%" height={20} style={styles.title} />
        <SkeletonLoader width="40%" height={16} style={styles.label} />
        <View style={styles.ingredients}>
          <SkeletonLoader width={60} height={24} borderRadius={12} />
          <SkeletonLoader width={60} height={24} borderRadius={12} />
        </View>
        <SkeletonLoader width="100%" height={40} borderRadius={8} style={styles.button} />
      </View>
    </View>
  );
};

export const GridRecipeSkeleton = () => {
  return (
    <View style={styles.gridCard}>
      <SkeletonLoader width="100%" height={120} />
      <View style={styles.gridContent}>
        <SkeletonLoader width="90%" height={18} style={styles.gridTitle} />
        <View style={styles.gridTags}>
          <SkeletonLoader width={50} height={20} borderRadius={10} />
          <SkeletonLoader width={50} height={20} borderRadius={10} />
        </View>
        <SkeletonLoader width="100%" height={36} borderRadius={8} />
      </View>
    </View>
  );
};

export const HomeScreenSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Hero Section Skeleton */}
      <View style={styles.heroSection}>
        <SkeletonLoader width="60%" height={32} style={styles.heroTitle} />
        <SkeletonLoader width="80%" height={16} style={styles.heroSubtitle} />
        <SkeletonLoader width="100%" height={50} style={styles.searchInput} />
        <View style={styles.tagsContainer}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} width={70} height={30} borderRadius={15} />
          ))}
        </View>
      </View>

      {/* Featured Section Skeleton */}
      <View style={styles.featuredSection}>
        <SkeletonLoader width={150} height={24} style={styles.sectionTitle} />
        <View style={styles.featuredGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.featuredCard}>
              <SkeletonLoader width={48} height={48} borderRadius={24} />
              <SkeletonLoader width={60} height={16} style={styles.featuredText} />
            </View>
          ))}
        </View>
      </View>

      {/* Benefits Section Skeleton */}
      <View style={styles.benefitsSection}>
        <SkeletonLoader width={180} height={24} style={styles.sectionTitle} />
        <View style={styles.benefitsList}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.benefitItem}>
              <SkeletonLoader width={32} height={32} borderRadius={16} />
              <SkeletonLoader width="70%" height={18} style={styles.benefitText} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export const SearchResultsSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={styles.resultsHeader}>
        <SkeletonLoader width={120} height={20} />
        <SkeletonLoader width={80} height={20} />
      </View>
      {[1, 2, 3].map((i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  heroSection: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  heroTitle: {
    marginBottom: 8,
    alignSelf: 'center',
  },
  heroSubtitle: {
    marginBottom: 16,
    alignSelf: 'center',
  },
  searchInput: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featuredSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  featuredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featuredCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredText: {
    marginTop: 8,
  },
  benefitsSection: {
    marginBottom: 20,
  },
  benefitsList: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    marginLeft: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    height: 120,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  title: {
    marginBottom: 8,
  },
  label: {
    marginBottom: 6,
  },
  ingredients: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  button: {
    marginTop: 4,
  },
  gridCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  gridContent: {
    padding: 10,
  },
  gridTitle: {
    marginBottom: 8,
  },
  gridTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});

export default RecipeCardSkeleton;
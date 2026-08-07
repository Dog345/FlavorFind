import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { COLORS } from '../constants/config';
import Icon from 'react-native-vector-icons/Ionicons';

const AboutScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="star" size={60} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>FlavorFind</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About FlavorFind</Text>
          <Text style={styles.description}>
            FlavorFind is your ultimate recipe discovery platform powered by advanced AI technology. 
            We help you find the perfect recipes based on ingredients you already have in your kitchen.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.description}>
            To reduce food waste and make cooking accessible to everyone by providing intelligent recipe recommendations.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Enter Ingredients</Text>
                <Text style={styles.stepDescription}>
                  Simply enter the ingredients you have in your kitchen
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>AI Matching</Text>
                <Text style={styles.stepDescription}>
                  Our AI finds recipes that match your available ingredients
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Cook & Enjoy</Text>
                <Text style={styles.stepDescription}>
                  Get step-by-step instructions and cook delicious meals
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          
          <View style={styles.featureItem}>
            <Icon name="checkmark-circle" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>AI-powered recipe matching</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Icon name="checkmark-circle" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Thousands of recipes</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Icon name="checkmark-circle" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Save favorite recipes</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Icon name="checkmark-circle" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Step-by-step instructions</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Icon name="checkmark-circle" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Quick and easy preparation</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Developer</Text>
          
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => Linking.openURL('https://api.whatsapp.com/send/?phone=254796605409')}
          >
            <Icon name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={styles.contactText}>0796605409</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 FlavorFind. All Rights Reserved.
          </Text>
          <Text style={styles.footerSubText}>
            Discover, Cook, Enjoy
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: COLORS.card,
    marginBottom: 16,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  description: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  stepContainer: {
    marginTop: 8,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    color: COLORS.text,
    fontSize: 14,
    marginLeft: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
  },
  contactText: {
    color: COLORS.text,
    fontSize: 16,
    marginLeft: 10,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  footerSubText: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
});

export default AboutScreen;